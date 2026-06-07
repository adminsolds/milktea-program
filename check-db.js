const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all('SELECT * FROM delivery_platforms', [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    return;
  }
  console.log('配送平台数量:', rows.length);
  rows.forEach(row => {
    console.log(`- ${row.name} (${row.code}): ${row.api_url}, 启用: ${row.is_active}`);
  });
  db.close();
});