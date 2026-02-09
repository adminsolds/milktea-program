/**
 * 在跑腿小程序数据库中初始化半夏奶茶店平台配置
 */

const mysql = require('mysql2/promise');

async function initPlatform() {
  // 数据库配置（跑腿小程序数据库）
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'delivery_app',
    port: 3306
  };

  const platformConfig = {
    platformCode: 'banxia_naicha',
    platformName: '半夏奶茶店',
    apiKey: 'bk_banxia_123456',
    apiSecret: 'sk_banxia_abcdefghijklmnopqrstuvwxyz123456',
    callbackUrl: 'http://localhost:3000/api/delivery/callback',
    status: 1
  };

  try {
    console.log('========================================');
    console.log('   初始化半夏奶茶店平台配置');
    console.log('========================================\n');

    // 连接数据库
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 检查表是否存在
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'external_platforms'"
    );

    if (tables.length === 0) {
      console.log('\n创建 external_platforms 表...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS external_platforms (
          id INT AUTO_INCREMENT PRIMARY KEY,
          platform_code VARCHAR(50) NOT NULL UNIQUE COMMENT '平台代码',
          platform_name VARCHAR(100) NOT NULL COMMENT '平台名称',
          api_key VARCHAR(100) NOT NULL COMMENT 'API密钥',
          api_secret VARCHAR(100) NOT NULL COMMENT 'API密钥',
          callback_url VARCHAR(500) DEFAULT NULL COMMENT '默认回调地址',
          status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='第三方平台配置表'
      `);
      console.log('✅ 表创建成功');
    }

    // 检查平台是否已存在
    const [existing] = await connection.execute(
      'SELECT * FROM external_platforms WHERE platform_code = ?',
      [platformConfig.platformCode]
    );

    if (existing.length > 0) {
      console.log('\n平台已存在，更新配置...');
      await connection.execute(
        `UPDATE external_platforms 
         SET platform_name = ?, api_key = ?, api_secret = ?, callback_url = ?, status = ?
         WHERE platform_code = ?`,
        [
          platformConfig.platformName,
          platformConfig.apiKey,
          platformConfig.apiSecret,
          platformConfig.callbackUrl,
          platformConfig.status,
          platformConfig.platformCode
        ]
      );
      console.log('✅ 平台配置已更新');
    } else {
      console.log('\n创建新平台配置...');
      await connection.execute(
        `INSERT INTO external_platforms (platform_code, platform_name, api_key, api_secret, callback_url, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          platformConfig.platformCode,
          platformConfig.platformName,
          platformConfig.apiKey,
          platformConfig.apiSecret,
          platformConfig.callbackUrl,
          platformConfig.status
        ]
      );
      console.log('✅ 平台配置已创建');
    }

    // 验证配置
    const [result] = await connection.execute(
      'SELECT * FROM external_platforms WHERE platform_code = ?',
      [platformConfig.platformCode]
    );

    console.log('\n平台配置信息:');
    console.log('  平台代码:', result[0].platform_code);
    console.log('  平台名称:', result[0].platform_name);
    console.log('  API Key:', result[0].api_key);
    console.log('  API Secret:', result[0].api_secret);
    console.log('  回调地址:', result[0].callback_url);
    console.log('  状态:', result[0].status === 1 ? '启用' : '禁用');

    await connection.end();

    console.log('\n========================================');
    console.log('   平台配置初始化完成！');
    console.log('========================================');
    console.log('\n现在可以运行测试脚本发送订单:');
    console.log('  node scripts/test-send-to-runner.js');

  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

initPlatform();
