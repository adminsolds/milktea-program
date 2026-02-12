/**
 * 微信支付配置文件
 * 用户需要填写自己的微信支付商户信息
 */

// 临时配置：服务器地址（部署时请修改为实际地址）
const TEMP_SERVER_URL = 'http://39.102.214.230:3003';

module.exports = {
  // 是否启用微信支付
  enabled: true,

  // 小程序 AppID（必须填写）
  appId: process.env.WX_APPID || process.env.WECHAT_APPID || '',

  // 微信支付商户号（必须填写）
  mchId: process.env.WX_MCHID || process.env.WECHAT_MCH_ID || '',

  // 微信支付密钥（必须填写）
  apiKey: process.env.WX_API_KEY || process.env.WECHAT_API_KEY || '',

  // APIv3 密钥（新版本微信支付需要）
  apiV3Key: process.env.WECHAT_API_V3_KEY || '',

  // 商户证书序列号
  serialNo: process.env.WX_SERIAL_NO || process.env.WECHAT_CERT_SERIAL_NO || '',

  // 商户证书路径
  certPath: process.env.WECHAT_CERT_PATH || '',
  keyPath: process.env.WECHAT_CERT_KEY_PATH || '',

  // 支付通知地址（优先使用环境变量，其次使用临时配置）
  notifyUrl: process.env.WX_NOTIFY_URL || process.env.WECHAT_NOTIFY_URL || `${TEMP_SERVER_URL}/api/payment/wechat/notify`,

  // 退款通知地址
  refundNotifyUrl: process.env.WECHAT_REFUND_NOTIFY_URL || `${TEMP_SERVER_URL}/api/payment/wechat/refund-notify`,

  // 支付超时时间（分钟）
  paymentTimeout: 30,

  // 沙箱环境（测试时使用）
  sandbox: process.env.WECHAT_SANDBOX === 'true' || false,

  // 检查配置是否完整
  isConfigured() {
    return !!(
      this.appId &&
      this.mchId &&
      this.apiKey &&
      this.notifyUrl
    );
  },

  // 获取配置状态信息
  getConfigStatus() {
    return {
      enabled: this.enabled,
      configured: this.isConfigured(),
      missing: [
        !this.appId && '小程序 AppID',
        !this.mchId && '微信支付商户号',
        !this.apiKey && '微信支付密钥',
        !this.notifyUrl && '支付通知地址'
      ].filter(Boolean)
    };
  }
};
