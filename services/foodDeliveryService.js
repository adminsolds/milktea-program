const crypto = require('crypto');
const { DeliveryPlatform, Order, Store } = require('../models');

/**
 * 外卖平台服务
 * 用于将奶茶后台的订单发送到外卖平台（如半夏配送/跑腿小程序）
 */

/**
 * 生成HMAC-SHA256签名（与跑腿小程序一致）
 * @param {Object} params - 请求参数
 * @param {String} apiSecret - API密钥
 * @returns {String} 签名值
 */
function generateSignature(params, apiSecret) {
  // 1. 按key字母顺序排序
  const sortedKeys = Object.keys(params).sort();

  // 2. 拼接字符串（排除sign参数、空值、数组和对象）
  const signStr = sortedKeys
    .filter(key => {
      const value = params[key];
      return key !== 'sign' &&
             value !== undefined &&
             value !== null &&
             value !== '' &&
             typeof value !== 'object' &&
             typeof value !== 'function';
    })
    .map(key => `${key}=${String(params[key]).trim()}`)
    .join('&');

  // 3. HMAC-SHA256加密
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signStr)
    .digest('hex');

  return signature;
}

/**
 * 发送订单到外卖平台（适配跑腿小程序API）
 * @param {Object} order - 奶茶后台订单对象
 * @param {String} platformCode - 外卖平台代码
 */
async function sendOrderToPlatform(order, platformCode) {
  try {
    // 获取平台配置
    const platform = await DeliveryPlatform.findOne({
      where: { code: platformCode, is_active: true }
    });

    if (!platform) {
      throw new Error('外卖平台未配置或未启用');
    }

    // 获取门店信息
    const store = await Store.findByPk(order.store_id);
    if (!store) {
      throw new Error('门店信息不存在');
    }

    // 准备商品信息
    const goodsInfo = order.items.map(item => ({
      name: item.product_name,
      quantity: item.quantity,
      price: parseFloat(item.price)
    }));

    // 构建订单数据 - 适配跑腿小程序API格式
    const orderData = {
      platform_code: platform.code,
      external_order_no: String(order.order_no),
      timestamp: Math.floor(Date.now() / 1000),
      // 商户信息（奶茶店）
      merchant_name: store.name,
      merchant_address: store.address,
      merchant_phone: store.phone || '010-12345678',
      merchant_lat: store.latitude || 39.908692,
      merchant_lng: store.longitude || 116.397477,
      // 收货人信息
      receiver_name: String(order.receiver_name || ''),
      receiver_phone: String(order.receiver_phone || ''),
      receiver_address: String(order.receiver_address || ''),
      receiver_lat: order.receiver_lat || 39.918692,
      receiver_lng: order.receiver_lng || 116.407477,
      // 商品信息
      goods_info: JSON.stringify(goodsInfo),
      goods_amount: parseFloat(order.product_total || 0),
      delivery_fee: parseFloat(order.delivery_fee || 0),
      total_amount: parseFloat(order.final_price || 0),
      // 备注
      remark: String(order.remark || ''),
      // 回调地址
      callback_url: `${process.env.API_BASE_URL || 'http://localhost:3000/api'}/delivery/callback`
    };

    // 生成签名
    orderData.sign = generateSignature(orderData, platform.app_secret);

    console.log(`[外卖平台] 发送订单到 ${platform.name}:`, order.order_no);
    console.log('[外卖平台] 请求数据:', JSON.stringify(orderData, null, 2));

    // 调用跑腿小程序API
    const apiUrl = `${platform.api_url}/order/receive`;
    console.log('[外卖平台] API地址:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    console.log('[外卖平台] 响应结果:', JSON.stringify(result, null, 2));

    if (result.code === 0) {
      // 更新订单状态
      await order.update({
        platform_id: platform.id,
        platform_code: platform.code,
        platform_order_no: result.data.order_no,
        delivery_status: 'sent',
        platform_status: 'pending'
      });

      console.log(`[外卖平台] 订单发送成功:`, result.data);
      return {
        success: true,
        data: result.data
      };
    } else {
      throw new Error(result.message || '发送订单失败');
    }
  } catch (error) {
    console.error('[外卖平台] 发送订单失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 查询订单状态
 * @param {String} orderNo - 奶茶后台订单号
 * @param {String} platformCode - 外卖平台代码
 */
async function queryOrderStatus(orderNo, platformCode) {
  try {
    const platform = await DeliveryPlatform.findOne({
      where: { code: platformCode, is_active: true }
    });

    if (!platform) {
      throw new Error('外卖平台未配置');
    }

    const params = {
      platform_code: platform.code,
      order_no: orderNo,
      timestamp: Math.floor(Date.now() / 1000)
    };

    params.sign = generateSignature(params, platform.app_secret);

    const response = await fetch(`${platform.api_url}/order/status?${new URLSearchParams(params)}`);
    const result = await response.json();

    if (result.code === 0) {
      return {
        success: true,
        data: result.data
      };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('[外卖平台] 查询订单状态失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 取消订单
 * @param {String} orderNo - 奶茶后台订单号
 * @param {String} platformCode - 外卖平台代码
 * @param {String} reason - 取消原因
 */
async function cancelOrder(orderNo, platformCode, reason = '') {
  try {
    const platform = await DeliveryPlatform.findOne({
      where: { code: platformCode, is_active: true }
    });

    if (!platform) {
      throw new Error('外卖平台未配置');
    }

    const params = {
      platform_code: platform.code,
      order_no: orderNo,
      cancel_reason: reason,
      timestamp: Math.floor(Date.now() / 1000)
    };

    params.sign = generateSignature(params, platform.app_secret);

    const response = await fetch(`${platform.api_url}/order/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (result.code === 0) {
      // 更新订单状态
      const order = await Order.findOne({ where: { order_no: orderNo } });
      if (order) {
        await order.update({
          delivery_status: 'cancelled',
          cancel_reason: reason,
          cancelled_at: new Date()
        });
      }

      return {
        success: true,
        data: result.data
      };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('[外卖平台] 取消订单失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 处理配送状态回调
 * @param {Object} callbackData - 回调数据
 */
async function handleDeliveryCallback(callbackData) {
  try {
    const {
      order_no,           // 配送平台订单号
      external_order_no,  // 奶茶后台订单号
      status,             // 配送状态
      status_text,        // 状态文本
      rider_name,         // 骑手姓名
      rider_phone,        // 骑手电话
      timestamp
    } = callbackData;

    console.log('[外卖平台] 收到配送回调:', callbackData);

    // 查找订单
    const order = await Order.findOne({
      where: { order_no: external_order_no }
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 状态映射
    const statusMap = {
      0: 'pending',      // 待接单
      1: 'accepted',     // 已接单
      2: 'picked_up',    // 已取货
      3: 'delivered',    // 已送达
      4: 'cancelled'     // 已取消
    };

    // 更新订单配送状态
    await order.update({
      platform_status: status,
      delivery_status: statusMap[status] || 'unknown',
      rider_name: rider_name || null,
      rider_phone: rider_phone || null
    });

    console.log(`[外卖平台] 订单 ${external_order_no} 状态更新为: ${status_text}`);

    return {
      success: true,
      code: 0,
      message: 'success'
    };
  } catch (error) {
    console.error('[外卖平台] 处理配送回调失败:', error);
    return {
      success: false,
      code: -1,
      message: error.message
    };
  }
}

module.exports = {
  sendOrderToPlatform,
  queryOrderStatus,
  cancelOrder,
  handleDeliveryCallback,
  generateSignature
};
