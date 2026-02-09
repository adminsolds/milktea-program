const { sequelize } = require('./config/db');
const User = require('./models/user');

console.log('测试模型导入...');

// 测试User模型
console.log('User模型:', User);

console.log('测试完成！');