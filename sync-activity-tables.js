const { sequelize } = require('./config/db');
const MemberActivity = require('./models/memberActivity');
const MemberActivityLog = require('./models/memberActivityLog');

async function syncTables() {
  try {
    console.log('正在连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    console.log('\n正在同步 MemberActivity 表...');
    await MemberActivity.sync({ alter: true });
    console.log('✓ MemberActivity 表同步完成');

    console.log('\n正在同步 MemberActivityLog 表...');
    await MemberActivityLog.sync({ alter: true });
    console.log('✓ MemberActivityLog 表同步完成');

    console.log('\n所有表同步完成！');
  } catch (error) {
    console.error('同步失败:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

syncTables();
