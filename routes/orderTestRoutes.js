const express = require('express');
const router = express.Router();
const orderTestController = require('../controllers/orderTestController');

// 订单测试相关路由

// 创建测试订单
router.post('/create', orderTestController.createTestOrder);

// 模拟配送状态更新
router.post('/simulate-delivery-status', orderTestController.simulateDeliveryStatusUpdate);

// 模拟支付回调
router.post('/simulate-payment', orderTestController.simulatePaymentCallback);

// 清理测试数据
router.delete('/cleanup', orderTestController.cleanupTestData);

// 获取测试订单列表
router.get('/list', orderTestController.getTestOrders);

module.exports = router;