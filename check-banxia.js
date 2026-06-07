const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('查询 banxia 平台配置...\n');

db.get('SELECT * FROM delivery_platforms WHERE code = ?', ['banxia'], (err, row) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('❌ banxia 平台不存在！');
  } else {
    console.log('平台配置:');
    console.log('  名称:', row.name);
    console.log('  代码:', row.code);
    console.log('  API地址:', row.api_url);
    console.log('  app_key:', row.app_key);
    console.log('  app_secret:', row.app_secret ? '已设置' : '未设置');
    console.log('  回调地址:', row.callback_url);
    console.log('  是否启用:', row.is_active);
  }
  
  db.close();
});