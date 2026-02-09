const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Banner = sequelize.define('Banner', {
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '轮播图标题'
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '轮播图图片URL'
  },
  link: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '跳转链接'
  },
  position: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'home',
    comment: '位置（home首页, detail点餐页, category分类）'
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
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '开始时间'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '结束时间'
  }
}, {
  tableName: 'banners',
  comment: '轮播图表'
});

module.exports = Banner;