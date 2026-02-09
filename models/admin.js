const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Admin = sequelize.define('Admin', {
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '管理员用户名'
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '管理员密码'
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '管理员昵称'
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'admin',
    comment: '管理员角色'
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
  tableName: 'admins',
  comment: '管理员表'
});

module.exports = Admin;