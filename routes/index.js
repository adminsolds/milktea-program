const express = require('express');
const router = express.Router();

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '奶茶店小程序后台服务运行正常！',
    timestamp: new Date().toISOString()
  });
});

// 导入各个模块的路由
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const couponRoutes = require('./couponRoutes');
const storeRoutes = require('./storeRoutes');
const uiRoutes = require('./uiRoutes');
const statsRoutes = require('./statsRoutes');
const adminRoutes = require('./adminRoutes');
const memberLevelRoutes = require('./memberLevelRoutes');
const memberRoutes = require('./memberRoutes');
const uploadRoutes = require('./uploadRoutes');
const rechargeRoutes = require('./rechargeRoutes');
const balanceRoutes = require('./balanceRoutes');
const systemConfigRoutes = require('./systemConfigRoutes');
const publicSystemConfigRoutes = require('./publicSystemConfigRoutes');
const tabBarIconRoutes = require('./tabBarIconRoutes');
const paymentRoutes = require('./payment');
const subscriptionRoutes = require('./subscription');
const groupBuyRoutes = require('./groupBuyRoutes');
const deliveryPlatformRoutes = require('./deliveryPlatformRoutes');
const deliveryCallbackRoutes = require('./deliveryCallbackRoutes');
const deliveryOrderRoutes = require('./deliveryOrderRoutes');
const foodDeliveryCallbackRoutes = require('./foodDeliveryCallbackRoutes');
const deliveryRoutes = require('./delivery');
const addressRoutes = require('./addressRoutes');
const printRoutes = require('./printRoutes');
const memberActivityRoutes = require('./memberActivityRoutes');
const activityRoutes = require('./activityRoutes');

// 注册路由
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/stores', storeRoutes);
router.use('/ui', uiRoutes);
router.use('/stats', statsRoutes);
router.use('/member-levels', memberLevelRoutes);
router.use('/', memberRoutes);
router.use('/upload', uploadRoutes);
router.use('/recharge', rechargeRoutes);
router.use('/balance', balanceRoutes);
router.use('/system-configs', systemConfigRoutes);
router.use('/system-configs', publicSystemConfigRoutes);
router.use('/tabbar', tabBarIconRoutes);
router.use('/payment', paymentRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/group-buys', groupBuyRoutes);
router.use('/groupon', groupBuyRoutes); // 兼容前端的/groupon路径
router.use('/delivery-platforms', deliveryPlatformRoutes);
router.use('/callback/delivery', deliveryCallbackRoutes);
router.use('/delivery', deliveryRoutes); // 新的统一配送路由
router.use('/delivery-orders', deliveryOrderRoutes); // 第三方配送平台调用
router.use('/callback/food-delivery', foodDeliveryCallbackRoutes);
router.use('/addresses', addressRoutes);
router.use('/print', printRoutes);
router.use('/', memberActivityRoutes);
router.use('/activities', activityRoutes);

module.exports = router;