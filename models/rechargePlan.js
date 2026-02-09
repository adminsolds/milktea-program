const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RechargePlan = sequelize.define('RechargePlan', {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '储值方案名称'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '储值金额'
  },
  bonus_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '赠送金额'
  },
  bonus_points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '赠送积分'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序值'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否激活'
  }
}, {
  tableName: 'recharge_plans',
  comment: '储值方案表'
});

module.exports = RechargePlan;