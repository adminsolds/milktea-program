const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserActivity = sequelize.define('UserActivity', {
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
  prize: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '获得的奖品'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '参与时间'
  }
}, {
  tableName: 'user_activities',
  comment: '用户活动参与记录表'
});

module.exports = UserActivity;
