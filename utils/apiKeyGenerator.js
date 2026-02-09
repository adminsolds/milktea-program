const crypto = require('crypto');

/**
 * 生成API密钥
 * 格式: ak_ + 32位随机字符
 */
function generateApiKey() {
  const prefix = 'ak_';
  const randomBytes = crypto.randomBytes(24).toString('base64url');
  return prefix + randomBytes.substring(0, 32);
}

/**
 * 生成API Secret
 * 格式: sk_ + 48位随机字符
 */
function generateApiSecret() {
  const prefix = 'sk_';
  const randomBytes = crypto.randomBytes(36).toString('base64url');
  return prefix + randomBytes.substring(0, 48);
}

/**
 * 生成平台代码
 * 根据平台名称生成英文代码
 */
function generatePlatformCode(name) {
  // 移除特殊字符，转换为小写
  const cleaned = name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20);
  return cleaned;
}

/**
 * 验证IP是否在白名单中
 * @param {String} clientIp - 客户端IP
 * @param {String} whitelist - IP白名单（逗号分隔，支持通配符）
 */
function isIpAllowed(clientIp, whitelist) {
  if (!whitelist || whitelist.trim() === '') {
    return true; // 空白名单表示允许所有
  }

  const allowedIps = whitelist.split(',').map(ip => ip.trim());
  
  for (const allowedIp of allowedIps) {
    // 精确匹配
    if (allowedIp === clientIp) {
      return true;
    }
    
    // 通配符匹配（如 192.168.1.*）
    if (allowedIp.includes('*')) {
      const pattern = allowedIp.replace(/\./g, '\\.').replace(/\*/g, '\\d+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(clientIp)) {
        return true;
      }
    }
    
    // CIDR 匹配（如 192.168.1.0/24）
    if (allowedIp.includes('/')) {
      if (isIpInCidr(clientIp, allowedIp)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 检查IP是否在CIDR范围内
 */
function isIpInCidr(ip, cidr) {
  const [range, bits] = cidr.split('/');
  const mask = parseInt(bits);
  
  const ipParts = ip.split('.').map(Number);
  const rangeParts = range.split('.').map(Number);
  
  const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
  const rangeInt = (rangeParts[0] << 24) + (rangeParts[1] << 16) + (rangeParts[2] << 8) + rangeParts[3];
  
  const maskInt = ~((1 << (32 - mask)) - 1);
  
  return (ipInt & maskInt) === (rangeInt & maskInt);
}

module.exports = {
  generateApiKey,
  generateApiSecret,
  generatePlatformCode,
  isIpAllowed
};
