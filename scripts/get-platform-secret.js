/**
 * 获取跑腿小程序平台配置的API Secret
 */

const mysql = require('mysql2/promise');

async function getPlatformSecret() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'delivery_app',
    port: 3306
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT platformCode, platformName, apiKey, apiSecret, callbackUrl, status FROM external_platforms WHERE platformCode = ?',
      ['banxia']
    );

    if (rows.length > 0) {
      const platform = rows[0];
      console.log('平台配置信息:');
      console.log('  平台代码:', platform.platformCode);
      console.log('  平台名称:', platform.platformName);
      console.log('  API Key:', platform.apiKey);
      console.log('  API Secret:', platform.apiSecret);
      console.log('  回调地址:', platform.callbackUrl);
      console.log('  状态:', platform.status === 1 ? '启用' : '禁用');
    } else {
      console.log('未找到平台配置');
    }

    await connection.end();
  } catch (error) {
    console.error('查询失败:', error.message);
  }
}

getPlatformSecret();
