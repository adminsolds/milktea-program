const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');
const Store = require('./store');

const Order = sequelize.define('Order', {
  order_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '订单号'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '用户ID（POS现场点单时可为空）'
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '店铺ID'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  product_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '商品总价'
  },
  delivery_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '配送费'
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '优惠券折扣'
  },
  member_discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '会员折扣'
  },
  final_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: '最终价格'
  },
  coupon_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '优惠券ID'
  },
  payment_method: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '支付方式'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '订单状态（0已取消, 1已下单, 2制作中, 3制作完成, 4配送中/待取餐, 5已完成, 6已送达）'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '联系电话'
  },
  pay_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '支付时间'
  },
  complete_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '完成时间'
  },
  // 外卖平台相关字段
  platform_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '外卖平台ID'
  },
  platform_order_no: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '外卖平台订单号'
  },
  platform_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '外卖平台代码'
  },
  platform_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '外卖平台状态'
  },
  platform_status_text: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '外卖平台状态描述'
  },
  order_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'self',
    comment: '订单类型：self-堂食，delivery-外卖，pickup-自取'
  },
  delivery_status: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '配送状态'
  },
  receiver_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '收货人姓名'
  },
  receiver_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '收货人电话'
  },
  receiver_address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '收货地址'
  },
  receiver_lat: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '收货地址纬度'
  },
  receiver_lng: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '收货地址经度'
  },
  rider_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '骑手姓名'
  },
  rider_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '骑手电话'
  },
  rider_lat: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '骑手纬度'
  },
  rider_lng: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '骑手经度'
  },
  cancel_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '取消原因'
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '取消时间'
  },
  delivery_updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '配送状态更新时间'
  },
  status_updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '状态更新时间'
  },
  source: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'miniapp',
    comment: '订单来源：miniapp-小程序，delivery_platform-外卖平台'
  },
  // 自取预约相关字段
  is_pickup: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为自取订单'
  },
  pickup_time: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '预约取餐时间（如：15分钟后 (14:35)）'
  },
  pickup_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '预约取餐分钟数（10/15/20/25/30）'
  },
  // POS现场点单相关
  is_pos: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为POS现场点单订单'
  }
}, {
  tableName: 'orders',
  comment: '订单表',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at'
});

// 关联关系
Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  constraints: false  // 允许 user_id 为 null
});

Order.belongsTo(Store, {
  foreignKey: 'store_id',
  as: 'store'
});

module.exports = Order;