const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '分类名称'
  },
  desc: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '分类描述'
  },
  icon: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '分类图标'
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
  tableName: 'categories',
  comment: '商品分类表'
});

module.exports = Category;