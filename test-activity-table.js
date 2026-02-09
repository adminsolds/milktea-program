const { sequelize } = require('./config/db');
const { MemberActivity, MemberActivityLog } = require('./models');

async function testActivityTable() {
  try {
    console.log('正在测试数据库连接...');
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    console.log('\n正在检查 member_activities 表...');
    const [activityResults] = await sequelize.query("SHOW TABLES LIKE 'member_activities'");
    if (activityResults.length > 0) {
      console.log('✓ member_activities 表存在');
      
      // 检查表结构
      const [columns] = await sequelize.query("DESCRIBE member_activities");
      console.log('\n表结构:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type}`);
      });
    } else {
      console.log('✗ member_activities 表不存在');
    }

    console.log('\n正在检查 member_activity_logs 表...');
    const [logResults] = await sequelize.query("SHOW TABLES LIKE 'member_activity_logs'");
    if (logResults.length > 0) {
      console.log('✓ member_activity_logs 表存在');
    } else {
      console.log('✗ member_activity_logs 表不存在');
    }

    console.log('\n尝试使用 Sequelize 查询活动...');
    const activities = await MemberActivity.findAll({ limit: 5 });
    console.log(`查询成功，找到 ${activities.length} 条活动记录`);

  } catch (error) {
    console.error('测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testActivityTable();
