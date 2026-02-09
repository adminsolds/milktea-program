/**
 * 检查跑腿小程序数据库表结构
 */

const mysql = require('mysql2/promise');

async function checkDatabase() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'delivery_app',
    port: 3306
  };

  try {
    console.log('检查跑腿小程序数据库...\n');

    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 显示所有表
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('数据库表列表:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });

    // 检查 external_platforms 表结构
    console.log('\n检查 external_platforms 表结构:');
    try {
      const [columns] = await connection.execute('DESCRIBE external_platforms');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
      });

      // 显示现有数据
      const [rows] = await connection.execute('SELECT * FROM external_platforms');
      console.log(`\n现有平台数据 (${rows.length} 条):`);
      rows.forEach(row => {
        console.log(`  - ${row.platform_code || row.platformCode}: ${row.platform_name || row.platformName} (${row.status === 1 ? '启用' : '禁用'})`);
      });
    } catch (e) {
      console.log('  表不存在或无法访问:', e.message);
    }

    await connection.end();

  } catch (error) {
    console.error('检查失败:', error.message);
    process.exit(1);
  }
}

checkDatabase();
