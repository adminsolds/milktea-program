const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');
const Coupon = require('./coupon');

const UserCoupon = sequelize.define('UserCoupon', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  coupon_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '优惠券ID'
  },
  is_used: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否已使用'
  },
  use_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '使用时间'
  },
  obtained_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '获取时间'
  }
}, {
  tableName: 'user_coupons',
  comment: '用户优惠券表'
});

// 关联关系
UserCoupon.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

UserCoupon.belongsTo(Coupon, {
  foreignKey: 'coupon_id',
  as: 'coupon'
});

module.exports = UserCoupon;