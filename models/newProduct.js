const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Product = require('./product');

const NewProduct = sequelize.define('NewProduct', {
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品ID'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序顺序'
  },
  is_active: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '是否激活'
  }
}, {
  tableName: 'new_products',
  comment: '新品推荐表'
});

// 关联关系
NewProduct.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

module.exports = NewProduct;