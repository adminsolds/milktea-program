const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Product = require('./product');

const ProductRecommendation = sequelize.define('ProductRecommendation', {
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'new',
    comment: '推荐类型：new新品推荐, hot热门推荐, custom自定义'
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '推荐标题'
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '推荐图片URL（商品图片）'
  },
  marketing_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '营销宣传图片URL（优先显示）'
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联商品ID'
  },
  link_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'product',
    comment: '链接类型：product商品详情, page页面, custom自定义链接'
  },
  link_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '自定义链接URL'
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
  tableName: 'product_recommendations',
  comment: '商品推荐表'
});

ProductRecommendation.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

module.exports = ProductRecommendation;
