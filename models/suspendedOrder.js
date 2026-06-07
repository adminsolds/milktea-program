const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Store = require('./store');

const SuspendedOrder = sequelize.define('SuspendedOrder', {
  suspended_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '挂起单号'
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '店铺ID'
  },
  cart_data: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '购物车数据（JSON格式）'
  },
  member_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '会员手机号'
  },
  order_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'dine_in',
    comment: '订单类型：dine_in-堂食，takeout-外带'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  is_restored: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否已恢复'
  }
}, {
  tableName: 'suspended_orders',
  comment: '挂起订单表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// 关联关系
SuspendedOrder.belongsTo(Store, {
  foreignKey: 'store_id',
  as: 'store'
});

module.exports = SuspendedOrder;
