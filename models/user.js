const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  openid: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '微信OpenID'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '手机号'
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '昵称'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像URL'
  },
  member_no: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    comment: '会员编号'
  },
  member_level: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'normal',
    comment: '会员等级'
  },
  growth_value: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '成长值'
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '积分'
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '余额'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否激活'
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  }
}, {
  tableName: 'users',
  comment: '用户表'
});

module.exports = User;