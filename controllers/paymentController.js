const crypto = require('crypto');
const axios = require('axios');
const { Order } = require('../models');
const wechatPayConfig = require('../config/wechat-pay');

/**
 * 微信支付工具类
 */
class WechatPayUtil {
  /**
   * 生成随机字符串
   */
  static generateNonceStr() {
    return Math.random().toString(36).substr(2, 32);
  }

  /**
   * 生成签名
   */
  static generateSign(params, apiKey) {
    // 1. 参数排序
    const sortedKeys = Object.keys(params).sort();

    // 2. 拼接参数字符串
    const stringA = sortedKeys
      .filter(key => params[key] !== '' && key !== 'sign')
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 3. 拼接API密钥
    const stringSignTemp = `${stringA}&key=${apiKey}`;

    // 4. MD5加密并转为大写
    return crypto
      .createHash('md5')
      .update(stringSignTemp, 'utf8')
      .digest('hex')
      .toUpperCase();
  }

  /**
   * 生成统一下单参数
   */
  static generateUnifiedOrderParams(orderData) {
    const { orderId, totalFee, body, openid } = orderData;

    const params = {
      appid: wechatPayConfig.appId,
      mch_id: wechatPayConfig.mchId,
      nonce_str: this.generateNonceStr(),
      body: body || '梁小糖-奶茶订单',
      out_trade_no: orderId,
      total_fee: Math.round(totalFee * 100), // 转换为分
      spbill_create_ip: '127.0.0.1',
      notify_url: wechatPayConfig.notifyUrl,
      trade_type: 'JSAPI',
      openid: openid
    };

    // 生成签名
    params.sign = this.generateSign(params, wechatPayConfig.apiKey);

    return params;
  }

  /**
   * 生成小程序支付参数
   */
  static generateMiniProgramPayParams(prepayId) {
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.generateNonceStr();
    const packageStr = `prepay_id=${prepayId}`;

    const params = {
      appId: wechatPayConfig.appId,
      timeStamp: timeStamp,
      nonceStr: nonceStr,
      package: packageStr,
      signType: 'MD5'
    };

    // 生成签名
    params.paySign = this.generateSign(params, wechatPayConfig.apiKey);

    return {
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType,
      paySign: params.paySign
    };
  }

  /**
   * XML转JSON
   */
  static xmlToJson(xml) {
    const result = {};
    const regex = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      result[match[1]] = match[2].trim();
    }

    return result;
  }

  /**
   * JSON转XML
   */
  static jsonToJson(obj) {
    let xml = '<xml>';

    for (const key in obj) {
      const value = obj[key];
      xml += `<${key}><
![CDATA[${value}]]></${key}>`;
    }

    xml += '</xml>';
    return xml;
  }

  /**
   * 调用统一下单API
   */
  static async unifiedOrder(params) {
    const url = 'https://api.mch.weixin.qq.com/pay/unifiedorder';

    const xml = this.jsonToJson(params);

    try {
      const response = await axios.post(url, xml, {
        headers: { 'Content-Type': 'application/xml' },
        timeout: 10000
      });

      const result = this.xmlToJson(response.data);

      if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
        return {
          success: true,
          prepayId: result.prepay_id
        };
      } else {
        return {
          success: false,
          error: result.return_msg || result.err_code_des
        };
      }
    } catch (error) {
      console.error('统一下单失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * 支付控制器
 */
const paymentController = {
  /**
   * 创建支付订单
   */
  async createPayment(req, res) {
    try {
      const { orderId, openid } = req.body;

      // 检查微信支付配置
      const configStatus = wechatPayConfig.getConfigStatus();
      if (!configStatus.configured) {
        return res.status(400).json({
          error: '微信支付未配置',
          missing: configStatus.missing,
          message: '请先在后台配置微信支付商户信息'
        });
      }

      // 查询订单
      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }

      // 检查订单状态
      if (order.status === 'paid') {
        return res.status(400).json({ error: '订单已支付' });
      }

      if (order.status === 'cancelled') {
        return res.status(400).json({ error: '订单已取消' });
      }

      // 生成统一下单参数
      const orderParams = WechatPayUtil.generateUnifiedOrderParams({
        orderId: order.order_no,
        totalFee: order.total_amount,
        body: `梁小糖-${order.order_no}`,
        openid: openid
      });

      // 调用统一下单API
      const unifiedResult = await WechatPayUtil.unifiedOrder(orderParams);

      if (!unifiedResult.success) {
        return res.status(500).json({
          error: '创建支付失败',
          message: unifiedResult.error
        });
      }

      // 生成小程序支付参数
      const payParams = WechatPayUtil.generateMiniProgramPayParams(unifiedResult.prepayId);

      // 更新订单状态为待支付
      await order.update({ status: 'pending' });

      res.json({
        success: true,
        ...payParams,
        orderId: order.order_no
      });
    } catch (error) {
      console.error('创建支付失败:', error);
      res.status(500).json({ error: '创建支付失败', message: error.message });
    }
  },

  /**
   * 微信支付通知回调
   */
  async paymentNotify(req, res) {
    try {
      let xml = '';

      req.on('data', chunk => {
        xml += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const data = WechatPayUtil.xmlToJson(xml);

          // 验证签名
          const sign = WechatPayUtil.generateSign(data, wechatPayConfig.apiKey);

          if (sign !== data.sign) {
            console.error('签名验证失败');
            return res.send(WechatPayUtil.jsonToJson({
              return_code: 'FAIL',
              return_msg: '签名失败'
            }));
          }

          // 处理支付结果
          if (data.return_code === 'SUCCESS' && data.result_code === 'SUCCESS') {
            const outTradeNo = data.out_trade_no;
            const transactionId = data.transaction_id;

            // 查找订单
            const order = await Order.findOne({
              where: { order_no: outTradeNo }
            });

            if (order) {
              // 更新订单状态
              await order.update({
                status: 'paid',
                payment_status: 'paid',
                payment_time: new Date(),
                transaction_id: transactionId
              });

              console.log(`订单 ${outTradeNo} 支付成功`);
            }

            // 返回成功响应
            res.send(WechatPayUtil.jsonToJson({
              return_code: 'SUCCESS',
              return_msg: 'OK'
            }));
          } else {
            res.send(WechatPayUtil.jsonToJson({
              return_code: 'FAIL',
              return_msg: data.return_msg || '支付失败'
            }));
          }
        } catch (error) {
          console.error('处理支付通知失败:', error);
          res.send(WechatPayUtil.jsonToJson({
            return_code: 'FAIL',
            return_msg: '处理失败'
          }));
        }
      });
    } catch (error) {
      console.error('支付通知处理失败:', error);
      res.status(500).json({ error: '处理失败' });
    }
  },

  /**
   * 查询支付状态
   */
  async queryPayment(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findOne({
        where: { order_no: orderId }
      });

      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }

      res.json({
        orderId: order.order_no,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentTime: order.payment_time
      });
    } catch (error) {
      console.error('查询支付状态失败:', error);
      res.status(500).json({ error: '查询失败' });
    }
  },

  /**
   * 申请退款
   */
  async createRefund(req, res) {
    try {
      const { orderId, refundAmount, reason } = req.body;

      // 检查配置
      if (!wechatPayConfig.isConfigured()) {
        return res.status(400).json({ error: '微信支付未配置' });
      }

      const order = await Order.findOne({
        where: { order_no: orderId }
      });

      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }

      if (order.status !== 'paid') {
        return res.status(400).json({ error: '订单未支付，无法退款' });
      }

      // TODO: 实现退款逻辑
      res.json({
        success: true,
        message: '退款申请已提交'
      });
    } catch (error) {
      console.error('申请退款失败:', error);
      res.status(500).json({ error: '退款失败' });
    }
  },

  /**
   * 获取支付配置状态
   */
  async getConfigStatus(req, res) {
    const status = wechatPayConfig.getConfigStatus();
    res.json(status);
  }
};

module.exports = paymentController;
