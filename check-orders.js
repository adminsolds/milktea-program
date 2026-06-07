const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('查询最近的外卖订单...\n');

db.all(`
  SELECT order_no, status, order_type, platform_code, receiver_name, final_price, created_at 
  FROM orders 
  WHERE order_type = 'delivery' 
  ORDER BY created_at DESC 
  LIMIT 5
`, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }
  
  console.log(`找到 ${rows.length} 个外卖订单:\n`);
  rows.forEach(row => {
    console.log('订单号:', row.order_no);
    console.log('状态:', row.status);
    console.log('订单类型:', row.order_type);
    console.log('平台代码:', row.platform_code || '未设置');
    console.log('收货人:', row.receiver_name);
    console.log('金额:', row.final_price);
    console.log('创建时间:', row.created_at);
    console.log('---');
  });
  
  db.close();
});