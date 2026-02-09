const crypto = require('crypto');
const axios = require('axios');

// 微信配置
const WECHAT_CONFIG = {
  appId: process.env.WECHAT_APP_ID || 'your-app-id',
  appSecret: process.env.WECHAT_APP_SECRET || 'your-app-secret'
};

// 获取微信session_key
const getSessionKey = async (code) => {
  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_CONFIG.appId}&secret=${WECHAT_CONFIG.appSecret}&js_code=${code}&grant_type=authorization_code`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('获取微信session_key失败:', error);
    throw new Error('获取微信session_key失败');
  }
};

// 解密微信数据
const decryptWechatData = (encryptedData, iv, sessionKey) => {
  try {
    // Base64解码
    const sessionKeyBuffer = Buffer.from(sessionKey, 'base64');
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    
    // 创建解密算法
    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
    decipher.setAutoPadding(true);
    
    // 解密数据
    let decrypted = decipher.update(encryptedDataBuffer, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    
    // 解析JSON
    const result = JSON.parse(decrypted);
    
    // 校验水印
    if (result.watermark && result.watermark.appid) {
      if (result.watermark.appid !== WECHAT_CONFIG.appId) {
        throw new Error('水印校验失败，数据可能被篡改');
      }
    }
    
    return result;
  } catch (error) {
    console.error('解密微信数据失败:', error);
    throw new Error('解密微信数据失败');
  }
};

// 校验微信数据签名
const verifyWechatSignature = (rawData, signature, sessionKey) => {
  try {
    // 计算签名
    const crypto = require('crypto');
    const computedSignature = crypto.createHash('sha1').update(rawData + sessionKey).digest('hex');
    
    // 比较签名
    return computedSignature === signature;
  } catch (error) {
    console.error('校验微信签名失败:', error);
    return false;
  }
};

// 检查session_key有效性
const checkSessionKeyValidity = (sessionKey) => {
  // 微信没有提供直接检查session_key有效性的API
  // 这里可以实现自定义的时效性策略
  // 例如，记录session_key的生成时间，超过一定时间后认为无效
  return true;
};

// 解密手机号
const decryptPhoneNumber = async (code, encryptedData, iv) => {
  try {
    // 获取session_key
    const sessionData = await getSessionKey(code);
    
    if (!sessionData.session_key) {
      throw new Error('获取session_key失败: ' + (sessionData.errmsg || '未知错误'));
    }
    
    // 解密手机号
    const decryptedData = decryptWechatData(encryptedData, iv, sessionData.session_key);
    
    if (!decryptedData.phoneNumber) {
      throw new Error('解密手机号失败，未找到phoneNumber字段');
    }
    
    return decryptedData.phoneNumber;
  } catch (error) {
    console.error('解密手机号失败:', error);
    throw error;
  }
};

module.exports = {
  getSessionKey,
  decryptWechatData,
  decryptPhoneNumber
};
