const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RechargeRecord = sequelize.define('RechargeRecord', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '储值金额'
  },
  bonus_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '赠送金额'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '总金额（储值+赠送）'
  },
  recharge_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'wxpay',
    comment: '储值方式（wxpay:微信支付, alipay:支付宝, admin:管理员操作）'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'completed',
    comment: '储值状态（pending:待处理, completed:已完成, failed:失败）'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'recharge_records',
  comment: '储值记录表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = RechargeRecord;