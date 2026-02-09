const express = require('express');
const router = express.Router();
const deliveryOrderController = require('../controllers/deliveryOrderController');

// 配送订单API路由
// 这些接口供第三方配送平台调用，用于推送订单到奶茶店系统

// 接收配送订单
router.post('/:platformCode/order', deliveryOrderController.receiveDeliveryOrder);

// 查询订单状态
router.get('/:platformCode/order/:orderNo', deliveryOrderController.queryOrderStatus);

// 取消订单
router.post('/:platformCode/order/:orderNo/cancel', deliveryOrderController.cancelOrder);

// 确认订单
router.post('/:platformCode/order/:orderNo/confirm', deliveryOrderController.confirmOrder);

// 获取店铺列表
router.get('/:platformCode/stores', deliveryOrderController.getStores);

module.exports = router;
