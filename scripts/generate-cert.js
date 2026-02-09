const fs = require('fs');
const path = require('path');

// 使用 selfsigned 库生成自签名证书
// 或者使用 Node.js 原生方法生成简单的自签名证书

// 生成私钥和证书的脚本
console.log('生成自签名 SSL 证书...\n');

// 使用 openssl 命令生成证书（如果系统有 openssl）
const { execSync } = require('child_process');

const certDir = path.join(__dirname, '../certs');
const keyPath = path.join(certDir, 'private-key.pem');
const certPath = path.join(certDir, 'certificate.pem');

// 确保证书目录存在
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

try {
  // 尝试使用 openssl 生成证书
  console.log('使用 OpenSSL 生成证书...');
  execSync(`openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=192.168.3.61" -keyout "${keyPath}" -out "${certPath}" -days 365`, {
    stdio: 'inherit',
    cwd: certDir
  });
  console.log('\n✓ 证书生成成功！');
  console.log(`  私钥: ${keyPath}`);
  console.log(`  证书: ${certPath}`);
  console.log(`  有效期: 365天`);
  console.log(`  适用域名: 192.168.3.61`);
} catch (error) {
  console.error('\nOpenSSL 生成失败，请确保系统已安装 OpenSSL');
  console.error('或者手动使用以下命令生成证书：');
  console.error(`\nopenssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=192.168.3.61" -keyout private-key.pem -out certificate.pem -days 365`);
  console.error('\n在证书目录运行:', certDir);
  process.exit(1);
}
