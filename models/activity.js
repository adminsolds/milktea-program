const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Activity = sequelize.define('Activity', {
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '活动标题'
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '活动类型（lottery, birthday, member-day）'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '活动描述'
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '活动图片'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '开始时间'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '结束时间'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否激活'
  },
  daily_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
    comment: '每日参与次数限制'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序'
  },
  reward: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '奖励内容（JSON格式）'
  },
  prizes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '奖品列表（JSON格式）'
  }
}, {
  tableName: 'activities',
  comment: '活动表'
});

module.exports = Activity;
