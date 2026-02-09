const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');
const MemberActivity = require('./memberActivity');

const MemberActivityLog = sequelize.define('MemberActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  activity_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '活动ID'
  },
  activity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '活动类型'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '操作类型：lottery-抽奖, receive-领取福利, purchase-购买等'
  },
  result: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '操作结果（JSON格式）'
  },
  reward_type: {
    type: DataTypes.ENUM('points', 'coupon', 'product', 'discount', 'none'),
    allowNull: true,
    comment: '奖励类型：points-积分, coupon-优惠券, product-商品, discount-折扣, none-无奖励'
  },
  reward_value: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '奖励内容（JSON格式）'
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'IP地址'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理信息'
  }
}, {
  tableName: 'member_activity_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// 关联关系
MemberActivityLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

MemberActivityLog.belongsTo(MemberActivity, {
  foreignKey: 'activity_id',
  as: 'activity'
});

module.exports = MemberActivityLog;
