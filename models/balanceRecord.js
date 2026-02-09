const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');

const BalanceRecord = sequelize.define('BalanceRecord', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '变动类型：recharge-充值, consume-消费, refund-退款, adjust-调整'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '变动金额（正数为增加，负数为减少）'
  },
  balance_before: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '变动前余额'
  },
  balance_after: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '变动后余额'
  },
  source_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '来源类型：recharge-储值, order-订单, admin-管理员操作, system-系统'
  },
  source_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '来源ID（如订单ID、储值记录ID）'
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '描述'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'completed',
    comment: '状态：pending-待处理, completed-已完成, failed-失败'
  }
}, {
  tableName: 'balance_records',
  comment: '余额记录表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_type',
      fields: ['type']
    },
    {
      name: 'idx_created_at',
      fields: ['created_at']
    },
    {
      name: 'idx_source',
      fields: ['source_type', 'source_id']
    }
  ]
});

// 关联关系
BalanceRecord.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

module.exports = BalanceRecord;
