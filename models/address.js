const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '地址ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  openid: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '微信OpenID'
  },
  contact_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '联系人姓名'
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '联系电话'
  },
  province: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '省份'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '城市'
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '区县'
  },
  detail_address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '详细地址'
  },
  full_address: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '完整地址'
  },
  is_default: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '是否默认地址'
  },
  tag: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '地址标签（家、公司、学校等）'
  }
}, {
  tableName: 'addresses',
  comment: '地址表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Address;
