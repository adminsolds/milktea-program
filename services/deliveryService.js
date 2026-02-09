const axios = require('axios');
const { generateSignature, getTimestamp } = require('../utils/deliverySignature');
const { DeliveryPlatform } = require('../models');
const config = require('../config/delivery');

/**
 * 配送服务类
 * 根据 MINIPROGRAM_INTEGRATION_GUIDE.md 文档实现
 */
class DeliveryService {
  constructor() {
    this.baseUrl = config.baseUrl;
    this.platformCode = config.platformCode;
    this.apiSecret = config.apiSecret;
    this.callbackUrl = config.callbackUrl;
    this.timeout = config.timeout;
    this.enabled = config.enabled;
  }

  /**
   * 获取平台配置（支持多平台）
   * @param {String} platformCode - 平台代码
   */
  async getPlatformConfig(platformCode) {
    const platform = await DeliveryPlatform.findOne({
      where: { code: platformCode, is_active: true }
    });

    if (!platform) {
      throw new Error('配送平台未配置或已禁用');
    }

    if (!platform.api_url || !platform.app_secret) {
      throw new Error('配送平台API配置不完整');
    }

    return platform;
  }

  /**
   * 发送订单到配送平台
   * @param {String} platformCode - 平台代码
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 配送订单信息
   */
  async createOrder(platformCode, orderData) {
    try {
      // 检查配送是否启用
      if (!this.enabled) {
        return {
          success: false,
          message: '配送功能未启用'
        };
      }

      const platform = await this.getPlatformConfig(platformCode);

      // 构建请求参数（根据文档格式）
      const requestData = {
        platform_code: platformCode,
        api_secret: platform.app_secret,
        external_order_no: orderData.orderNo,
        merchant_name: orderData.shopName,
        merchant_address: orderData.shopAddress,
        merchant_phone: orderData.shopPhone,
        merchant_lat: orderData.shopLat,
        merchant_lng: orderData.shopLng,
        receiver_name: orderData.customerName,
        receiver_phone: orderData.customerPhone,
        receiver_address: orderData.customerAddress,
        receiver_lat: orderData.customerLat,
        receiver_lng: orderData.customerLng,
        goods_info: JSON.stringify(orderData.items || []),
        goods_amount: orderData.goodsAmount || 0,
        delivery_fee: orderData.deliveryFee || 0,
        total_amount: orderData.totalAmount || 0,
        remark: orderData.remark || '',
        callback_url: platform.callback_url || this.callbackUrl
      };

      const response = await axios.post(
        `${platform.api_url}/order/receive`,
        requestData,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 0) {
        return {
          success: true,
          deliveryOrderNo: response.data.data.order_no,
          status: response.data.data.status,
          statusText: response.data.data.status_text,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          code: response.data.code,
          message: response.data.message || '配送下单失败'
        };
      }
    } catch (error) {
      console.error('创建配送订单失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '网络请求失败'
      };
    }
  }

  /**
   * 查询订单配送状态
   * @param {String} platformCode - 平台代码
   * @param {String} deliveryOrderNo - 配送平台订单号
   * @returns {Promise<Object>} 订单状态
   */
  async getOrderStatus(platformCode, deliveryOrderNo) {
    try {
      const platform = await this.getPlatformConfig(platformCode);

      const response = await axios.get(
        `${platform.api_url}/order/status`,
        {
          params: {
            platform_code: platformCode,
            api_secret: platform.app_secret,
            order_no: deliveryOrderNo
          },
          timeout: this.timeout
        }
      );

      if (response.data.code === 0) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data.message || '查询配送状态失败'
        };
      }
    } catch (error) {
      console.error('查询订单状态失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '网络请求失败'
      };
    }
  }

  /**
   * 取消配送订单
   * @param {String} platformCode - 平台代码
   * @param {String} deliveryOrderNo - 配送平台订单号
   * @param {String} reason - 取消原因
   * @returns {Promise<Object>} 取消结果
   */
  async cancelOrder(platformCode, deliveryOrderNo, reason = '') {
    try {
      const platform = await this.getPlatformConfig(platformCode);

      const response = await axios.post(
        `${platform.api_url}/order/cancel`,
        {
          platform_code: platformCode,
          api_secret: platform.app_secret,
          order_no: deliveryOrderNo,
          cancel_reason: reason
        },
        { timeout: this.timeout }
      );

      return {
        success: response.data.code === 0,
        message: response.data.message
      };
    } catch (error) {
      console.error('取消配送订单失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '网络请求失败'
      };
    }
  }

  /**
   * 发送订单到配送平台（兼容旧方法名）
   * @param {String} platformCode - 平台代码
   * @param {Object} orderData - 订单数据
   */
  async sendOrder(platformCode, orderData) {
    return this.createOrder(platformCode, orderData);
  }

  /**
   * 查询订单配送状态（兼容旧方法名）
   * @param {String} platformCode - 平台代码
   * @param {String} deliveryOrderNo - 配送平台订单号
   */
  async queryOrderStatus(platformCode, deliveryOrderNo) {
    const result = await this.getOrderStatus(platformCode, deliveryOrderNo);
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  }

  /**
   * 测试签名生成
   * @param {String} platformCode - 平台代码
   */
  async testSignature(platformCode) {
    try {
      const platform = await this.getPlatformConfig(platformCode);

      const params = {
        platform_code: platformCode,
        external_order_no: `TEST${getTimestamp()}${Math.floor(Math.random() * 1000)}`,
        timestamp: getTimestamp(),
        receiver_name: '测试收货人',
        receiver_phone: '13800138000',
        receiver_address: '测试地址'
      };

      const sign = generateSignature(params, platform.app_secret);

      return {
        success: true,
        params,
        sign,
        apiUrl: `${platform.api_url}/order/receive`
      };
    } catch (error) {
      console.error('测试签名生成失败:', error);
      throw error;
    }
  }
}

module.exports = new DeliveryService();
