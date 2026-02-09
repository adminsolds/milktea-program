const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MemberLevel = sequelize.define('MemberLevel', {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '会员等级名称'
  },
  level_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '会员等级标识（如普通会员, 银卡, 金卡）'
  },
  growth_required: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '升级到该等级所需的成长值'
  },
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 100.00,
    comment: '会员折扣（100表示无折扣，95表示95折）'
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '会员等级图标'
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '会员等级颜色'
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
  tableName: 'member_levels',
  comment: '会员等级表'
});

module.exports = MemberLevel;