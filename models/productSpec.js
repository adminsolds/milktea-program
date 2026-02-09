const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProductSpec = sequelize.define('ProductSpec', {
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品ID'
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '规格类型（ice, sugar, topping）'
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '规格名称'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '额外价格'
  },
  is_required: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否必填'
  }
}, {
  tableName: 'product_specs',
  comment: '商品规格表'
});

// 关联关系在 models/index.js 中定义

module.exports = ProductSpec;