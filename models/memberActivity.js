const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MemberActivity = sequelize.define('MemberActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '活动名称'
  },
  type: {
    type: DataTypes.ENUM('lottery', 'member_day', 'birthday', 'new_product', 'flash_sale', 'custom'),
    allowNull: false,
    comment: '活动类型：lottery-抽奖, member_day-会员日, birthday-生日福利, new_product-新品立减, flash_sale-限时抢购, custom-自定义'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '活动描述'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '活动开始时间'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '活动结束时间'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：0-禁用，1-启用'
  },
  config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '活动配置（JSON格式，根据活动类型不同配置不同）'
  },
  min_level: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '最低会员等级要求'
  },
  is_repeatable: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否可重复参与：0-否，1-是'
  },
  daily_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
    comment: '每日参与次数限制'
  },
  total_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '总参与次数限制'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序权重'
  }
}, {
  tableName: 'member_activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = MemberActivity;
