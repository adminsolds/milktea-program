const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Coupon = sequelize.define('Coupon', {
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '优惠券名称'
  },
  desc: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '优惠券描述'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '优惠金额'
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '优惠券类型（full, no-threshold）'
  },
  min_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '最低使用金额'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '开始时间'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '结束时间'
  },
  is_system: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否系统优惠券'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否激活'
  }
}, {
  tableName: 'coupons',
  comment: '优惠券表'
});

module.exports = Coupon;