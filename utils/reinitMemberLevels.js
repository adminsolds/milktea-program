/**
 * 强制重新初始化会员等级数据
 * 使用方法：在backend目录下运行 node utils/reinitMemberLevels.js
 */

const { MemberLevel } = require('../models');
const { sequelize } = require('../config/db');

const reinitMemberLevels = async () => {
  try {
    console.log('开始连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    console.log('正在清空现有会员等级数据...');
    // 使用 TRUNCATE 清空表并重置自增ID
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.query('TRUNCATE TABLE member_levels');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('现有数据已清空！');

    console.log('正在创建新的会员等级数据...');
    const defaultLevels = [
      {
        name: '普通会员',
        level_id: 'normal',
        growth_required: 0,
        discount: 90.00,
        color: '#6B7280',
        sort_order: 1
      },
      {
        name: '银卡会员',
        level_id: 'silver',
        growth_required: 1000,
        discount: 88.00,
        color: '#A0A0A0',
        sort_order: 2
      },
      {
        name: '金卡会员',
        level_id: 'gold',
        growth_required: 5000,
        discount: 85.00,
        color: '#D4AF37',
        sort_order: 3
      },
      {
        name: '白金会员',
        level_id: 'platinum',
        growth_required: 10000,
        discount: 80.00,
        color: '#E5E4E1',
        sort_order: 4
      },
      {
        name: '钻石会员',
        level_id: 'diamond',
        growth_required: 20000,
        discount: 75.00,
        color: '#B9F2FF',
        sort_order: 5
      }
    ];

    await MemberLevel.bulkCreate(defaultLevels);
    console.log('会员等级数据重新初始化成功！');
    console.log('\n新的会员等级配置：');
    defaultLevels.forEach(level => {
      console.log(`- ${level.name} (${level.level_id}): ${level.discount}%折扣`);
    });

  } catch (error) {
    console.error('重新初始化会员等级失败:', error);
  } finally {
    await sequelize.close();
    console.log('\n数据库连接已关闭！');
    process.exit(0);
  }
};

reinitMemberLevels();
