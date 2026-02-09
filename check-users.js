const { sequelize } = require('./config/db');
const { User } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({ order: [['createdAt', 'DESC']], limit: 5 });
    console.log('最近5个用户的会员状态:');
    users.forEach(u => {
      console.log(`ID: ${u.id}, 昵称: ${u.nickname}, 会员等级: ${u.member_level}, 成长值: ${u.growth_value}, 余额: ${u.balance}`);
    });
    await sequelize.close();
  } catch(e) {
    console.error(e);
  }
})();
