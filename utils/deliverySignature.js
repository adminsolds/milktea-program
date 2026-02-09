const crypto = require('crypto');

/**
 * 生成HMAC-SHA256签名
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
 * 生成时间戳
 */
function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * 验证签名
 * @param {Object} params - 请求参数
 * @param {String} apiSecret - API密钥
 * @returns {Boolean} 验证结果
 */
function verifySignature(params, apiSecret) {
  const sign = params.sign;
  if (!sign) return false;

  const calculatedSign = generateSignature(params, apiSecret);
  return sign === calculatedSign;
}

module.exports = {
  generateSignature,
  getTimestamp,
  verifySignature
};
