const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// 订单相关路由
router.get('/', orderController.getOrders);
router.get('/stats', orderController.getOrderStats);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.post('/:id/refund', orderController.refundOrder);

module.exports = router;