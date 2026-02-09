const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GroupBuyParticipant = sequelize.define('GroupBuyParticipant', {
  group_buy_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '团购活动ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订单ID'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '购买数量'
  },
  specs: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '选择的规格（JSON）'
  },
  is_leader: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '是否为团长'
  },
  join_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '参团时间'
  }
}, {
  tableName: 'group_buy_participants',
  comment: '团购参与者表',
  indexes: [
    {
      fields: ['group_buy_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['order_id']
    }
  ]
});

module.exports = GroupBuyParticipant;
