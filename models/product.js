const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Category = require('./category');

const Product = sequelize.define('Product', {
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '分类ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商品名称'
  },
  desc: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '商品描述'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '商品价格'
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '商品图片'
  },
  tags: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '标签（逗号分隔）'
  },
  sales: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '销量'
  },
  is_new: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否新品'
  },
  is_recommended: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否推荐'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否激活'
  },
  enable_toppings: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否启用配料'
  },
  enable_ice: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否启用冰度'
  },
  enable_sugar: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否启用甜度'
  },
  enable_size: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否启用杯型'
  },
  enable_size_small: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否启用小杯'
  },
  enable_size_medium: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否启用中杯'
  },
  enable_size_large: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否启用大杯'
  },
  price_small: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '小杯价格'
  },
  price_medium: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '中杯价格'
  },
  price_large: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '大杯价格'
  },
  delivery_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '配送费'
  }
}, {
  tableName: 'products',
  comment: '商品表'
});

// 关联关系
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

// ProductSpec 关联在 models/index.js 中定义

module.exports = Product;