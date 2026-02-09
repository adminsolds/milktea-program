const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// 创建支付订单（需要登录）
router.post('/create', authenticate, paymentController.createPayment);

// 查询支付状态（需要登录）
router.get('/query/:orderId', authenticate, paymentController.queryPayment);

// 申请退款（需要登录）
router.post('/refund', authenticate, paymentController.createRefund);

// 微信支付通知回调（不需要认证，微信服务器调用）
router.post('/wechat/notify', paymentController.paymentNotify);

// 获取支付配置状态（管理员）
router.get('/config/status', paymentController.getConfigStatus);

module.exports = router;
