const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TabBarIcon = sequelize.define('TabBarIcon', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  page_path: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '页面路径'
  },
  text: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'TabBar 文字'
  },
  icon_normal: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '未选中状态的图标URL'
  },
  icon_selected: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '选中状态的图标URL'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否激活：0-禁用，1-激活'
  }
}, {
  tableName: 'tab_bar_icons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'TabBar图标配置表'
});

module.exports = TabBarIcon;
