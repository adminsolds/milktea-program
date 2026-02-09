/**
 * 配送平台配置
 * 根据 MINIPROGRAM_INTEGRATION_GUIDE.md 文档配置
 */

module.exports = {
  // 配送平台API地址
  baseUrl: process.env.DELIVERY_API_URL || 'https://delivery-platform.com/api/external',

  // 平台代码（从配送平台获取）
  platformCode: process.env.DELIVERY_PLATFORM_CODE || 'wx_miniprogram_001',

  // API密钥（从配送平台获取）
  apiKey: process.env.DELIVERY_API_KEY,
  apiSecret: process.env.DELIVERY_API_SECRET,

  // 回调地址（你的服务器地址）
  callbackUrl: process.env.DELIVERY_CALLBACK_URL || 'http://localhost:3000/api/delivery/callback',

  // 请求超时时间（毫秒）
  timeout: 10000,

  // 是否启用配送
  enabled: process.env.DELIVERY_ENABLED !== 'false'
};
