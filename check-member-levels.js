const { MemberLevel } = require('./models');
const { sequelize } = require('./config/db');

async function checkMemberLevels() {
  try {
    await sequelize.authenticate();
    const levels = await MemberLevel.findAll({ where: { is_active: 1 } });
    console.log('会员等级数据:');
    levels.forEach(l => {
      console.log(`等级: ${l.level_id}, 折扣: ${l.discount}`);
    });
    await sequelize.close();
  } catch (error) {
    console.error('查询失败:', error);
  }
}

checkMemberLevels();
