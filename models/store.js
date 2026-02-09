const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Store = sequelize.define('Store', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '店铺名称'
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '店铺地址'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '联系电话'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否激活'
  },
  // 营业状态控制
  is_open: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '店铺是否营业中'
  },
  // 营业时间设置
  open_time: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '开店时间 (HH:mm格式，如 09:00)'
  },
  close_time: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '闭店时间 (HH:mm格式，如 22:00)'
  },
  // 闭店提示信息
  closed_message: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: '店铺已打烊，请明天再来',
    comment: '闭店时显示的提示信息'
  }
}, {
  tableName: 'stores',
  comment: '店铺表'
});

module.exports = Store;