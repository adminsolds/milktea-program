const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SystemConfig = sequelize.define('SystemConfig', {
  key: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    comment: '配置键'
  },
  value: {
    type: DataTypes.TEXT,
    comment: '配置值(JSON格式)'
  },
  description: {
    type: DataTypes.STRING(255),
    comment: '配置描述'
  },
  category: {
    type: DataTypes.STRING(50),
    comment: '配置分类'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'system_configs',
  timestamps: true,
  createdAt: false,
  updatedAt: 'update_time',
  comment: '系统配置表'
});

module.exports = SystemConfig;
