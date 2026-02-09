const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DeliveryPlatform = sequelize.define('DeliveryPlatform', {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '平台名称（如：美团外卖、饿了么）'
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '平台代码（如：meituan、eleme）'
  },
  platform_type: {
    type: DataTypes.ENUM('food_delivery', 'delivery_service'),
    allowNull: false,
    defaultValue: 'food_delivery',
    comment: '平台类型：food_delivery-外卖平台（美团/饿了么），delivery_service-配送平台（顺丰/达达）'
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '平台图标URL'
  },
  api_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'API接口地址'
  },
  web_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '网页端地址'
  },
  app_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'APP跳转链接'
  },
  merchant_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '商户ID'
  },
  app_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'API密钥（用于标识平台）'
  },
  app_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'API密钥（用于签名）'
  },
  callback_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '接收回调的地址（外卖平台推送订单/配送平台推送状态）'
  },
  ip_whitelist: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'IP白名单，多个IP用逗号分隔，支持通配符如192.168.1.*'
  },
  rate_limit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    comment: '限流配置（每分钟最大请求数）'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否启用'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序'
  },
  config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '额外配置（JSON格式）'
  }
}, {
  tableName: 'delivery_platforms',
  comment: '外卖/配送平台配置表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at'
});

module.exports = DeliveryPlatform;
