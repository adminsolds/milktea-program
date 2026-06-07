const express = require('express');
const router = express.Router();
const suspendedOrderController = require('../controllers/suspendedOrderController');
const { authenticate } = require('../middleware/auth');

// 创建挂起订单
router.post('/', authenticate, suspendedOrderController.createSuspendedOrder);

// 获取挂起订单列表
router.get('/', authenticate, suspendedOrderController.getSuspendedOrders);

// 恢复挂起订单
router.put('/:id/restore', authenticate, suspendedOrderController.restoreSuspendedOrder);

// 删除挂起订单
router.delete('/:id', authenticate, suspendedOrderController.deleteSuspendedOrder);

module.exports = router;
