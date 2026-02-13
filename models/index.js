const User = require('./user');
const Category = require('./category');
const Product = require('./product');
const ProductSpec = require('./productSpec');
const Store = require('./store');
const Order = require('./order');
const OrderItem = require('./orderItem');
const Coupon = require('./coupon');
const UserCoupon = require('./userCoupon');
const Banner = require('./banner');
const FunctionEntry = require('./functionEntry');
const NewProduct = require('./newProduct');
const ProductRecommendation = require('./productRecommendation');
const Admin = require('./admin');
const MemberLevel = require('./memberLevel');
const RechargePlan = require('./rechargePlan');
const RechargeRecord = require('./rechargeRecord');
const BalanceRecord = require('./balanceRecord');
const SystemConfig = require('./systemConfig');
const TabBarIcon = require('./tabBarIcon');
const GroupBuy = require('./groupBuy');
const GroupBuyParticipant = require('./groupBuyParticipant');
const DeliveryPlatform = require('./deliveryPlatform');
const Address = require('./address');
const MemberActivity = require('./memberActivity');
const MemberActivityLog = require('./memberActivityLog');
const Activity = require('./activity');
const UserActivity = require('./userActivity');

// 建立模型关联

// 一对多关系：一个分类有多个商品
Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products'
});

// 一对多关系：一个商品有多个规格
Product.hasMany(ProductSpec, {
  foreignKey: 'product_id',
  as: 'specs'
});

// 一对多关系：一个用户有多个订单
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders'
});

// 一对多关系：一个店铺有多个订单
Store.hasMany(Order, {
  foreignKey: 'store_id',
  as: 'orders'
});

// 一对多关系：一个订单有多个商品
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'items'
});

// 一对多关系：一个优惠券可以被多个用户拥有
Coupon.hasMany(UserCoupon, {
  foreignKey: 'coupon_id',
  as: 'userCoupons'
});

// 一对多关系：一个用户有多个优惠券
User.hasMany(UserCoupon, {
  foreignKey: 'user_id',
  as: 'coupons'
});

// 一对多关系：一个商品可以被推荐为新品
Product.hasOne(NewProduct, {
  foreignKey: 'product_id',
  as: 'newProduct'
});

// 一对多关系：一个商品可以有多个推荐
Product.hasMany(ProductRecommendation, {
  foreignKey: 'product_id',
  as: 'recommendations'
});

// 一对多关系：一个用户有多个储值记录
User.hasMany(RechargeRecord, {
  foreignKey: 'user_id',
  as: 'rechargeRecords'
});

// 一对多关系：一个用户有多个储值记录（反向关联）
RechargeRecord.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'rechargeUser'
});

// 一对多关系：一个用户有多个余额记录
User.hasMany(BalanceRecord, {
  foreignKey: 'user_id',
  as: 'balanceRecords'
});

// 一对多关系：余额记录属于用户
BalanceRecord.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'balanceUser'
});

// 一对多关系：一个团购活动有多个参与者
GroupBuy.hasMany(GroupBuyParticipant, {
  foreignKey: 'group_buy_id',
  as: 'participants'
});

// 一对多关系：一个用户可以参与多个团购
User.hasMany(GroupBuyParticipant, {
  foreignKey: 'user_id',
  as: 'groupBuys'
});

// 反向关联：团购参与者属于用户
GroupBuyParticipant.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'participantUser'
});

// 反向关联：团购参与者属于团购活动
GroupBuyParticipant.belongsTo(GroupBuy, {
  foreignKey: 'group_buy_id',
  as: 'groupBuy'
});

// 一对多关系：一个用户有多个地址
User.hasMany(Address, {
  foreignKey: 'user_id',
  as: 'addresses'
});

// 反向关联：地址属于用户
Address.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'addressUser'
});

// 一对多关系：一个用户有多个活动参与记录
User.hasMany(MemberActivityLog, {
  foreignKey: 'user_id',
  as: 'activityLogs'
});

// 一对多关系：一个活动有多个参与记录
MemberActivity.hasMany(MemberActivityLog, {
  foreignKey: 'activity_id',
  as: 'logs'
});

// 一对多关系：一个用户可以参与多个活动
User.hasMany(UserActivity, {
  foreignKey: 'user_id',
  as: 'activities'
});

// 一对多关系：一个活动可以被多个用户参与
Activity.hasMany(UserActivity, {
  foreignKey: 'activity_id',
  as: 'participants'
});

module.exports = {
  User,
  Category,
  Product,
  ProductSpec,
  Store,
  Order,
  OrderItem,
  Coupon,
  UserCoupon,
  Banner,
  FunctionEntry,
  NewProduct,
  ProductRecommendation,
  Admin,
  MemberLevel,
  RechargePlan,
  RechargeRecord,
  BalanceRecord,
  SystemConfig,
  TabBarIcon,
  GroupBuy,
  GroupBuyParticipant,
  DeliveryPlatform,
  Address,
  MemberActivity,
  MemberActivityLog,
  Activity,
  UserActivity
};