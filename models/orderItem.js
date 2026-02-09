const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Order = require('./order');
const Product = require('./product');

const OrderItem = sequelize.define('OrderItem', {
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订单ID'
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品ID'
  },
  product_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商品名称'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '单价'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '数量'
  },
  spec: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '规格'
  },
  sugar: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '糖分'
  },
  ice: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '冰度'
  },
  toppings: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '配料（JSON格式）'
  },
  product_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '商品图片'
  }
}, {
  tableName: 'order_items',
  comment: '订单商品表'
});

// 关联关系
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});

OrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
  constraints: false  // 禁用外键约束，允许 product_id 不存在于 Product 表
});

module.exports = OrderItem;