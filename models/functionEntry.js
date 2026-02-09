const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FunctionEntry = sequelize.define('FunctionEntry', {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '功能名称'
  },
  desc: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '功能描述'
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '功能类型'
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '图标URL'
  },
  link: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '跳转链接'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序顺序'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否激活'
  }
}, {
  tableName: 'function_entries',
  comment: '功能入口表'
});

module.exports = FunctionEntry;