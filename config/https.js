const fs = require('fs');
const path = require('path');

// HTTPS 配置
const httpsConfig = {
  // 证书文件路径
  cert: path.join(__dirname, '../certs/certificate.pem'),
  // 私钥文件路径
  key: path.join(__dirname, '../certs/private-key.pem'),
  // 是否启用 HTTPS
  enabled: true,
  // HTTPS 端口（默认与 HTTP 相同）
  port: process.env.HTTPS_PORT || 3000
};

// 验证证书文件是否存在
function validateHttpsConfig() {
  if (!httpsConfig.enabled) {
    return { valid: false, message: 'HTTPS 未启用' };
  }

  if (!fs.existsSync(httpsConfig.cert)) {
    return { valid: false, message: `证书文件不存在: ${httpsConfig.cert}` };
  }

  if (!fs.existsSync(httpsConfig.key)) {
    return { valid: false, message: `私钥文件不存在: ${httpsConfig.key}` };
  }

  return { valid: true };
}

module.exports = {
  httpsConfig,
  validateHttpsConfig
};
