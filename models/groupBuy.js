const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GroupBuy = sequelize.define('GroupBuy', {
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    comment: '团购活动名称'
  },
  desc: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '团购活动描述'
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '活动图片'
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '活动图片列表（JSON）'
  },
  product_ids: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '包含的商品ID列表（JSON）'
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '原价'
  },
  groupon_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '团购价'
  },
  min_participants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    comment: '最少参团人数'
  },
  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '最多参团人数'
  },
  current_participants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '当前参团人数'
  },
  max_purchase: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: '每人限购数量'
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
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'upcoming',
    comment: '状态（upcoming即将开始, ongoing进行中, ended已结束, cancelled已取消）'
  },
  sold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '已售数量'
  },
  rules: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '活动规则（JSON）'
  },
  specs: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '可选规格（JSON）'
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
  tableName: 'group_buys',
  comment: '团购活动表',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['start_time']
    },
    {
      fields: ['end_time']
    }
  ]
});

module.exports = GroupBuy;
