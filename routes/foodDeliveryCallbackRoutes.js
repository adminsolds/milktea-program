const express = require('express');
const router = express.Router();
const foodDeliveryCallbackController = require('../controllers/foodDeliveryCallbackController');

// 外卖平台回调路由
// 这些接口供外卖平台（如半夏配送、美团、饿了么）调用

// 接收外卖订单推送
// 外卖平台在用户下单后调用此接口推送订单到奶茶店系统
router.post('/:platformCode/order', foodDeliveryCallbackController.receiveOrder);

// 订单状态变更回调
// 外卖平台在订单状态变化时调用此接口通知奶茶店
router.post('/:platformCode/order-status', foodDeliveryCallbackController.handleOrderStatus);

// 订单取消回调
// 外卖平台在订单被取消时调用此接口通知奶茶店
router.post('/:platformCode/order-cancelled', foodDeliveryCallbackController.handleOrderCancelled);

module.exports = router;
