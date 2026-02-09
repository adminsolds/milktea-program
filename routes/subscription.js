const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

// 保存订阅设置
router.post('/settings', authenticate, subscriptionController.saveSubscriptionSettings);

// 获取订阅设置
router.get('/settings', authenticate, subscriptionController.getSubscriptionSettings);

// 发送订阅消息
router.post('/send', authenticate, subscriptionController.sendSubscriptionMessage);

// 批量发送订阅消息
router.post('/batch-send', authenticate, subscriptionController.batchSendSubscriptionMessage);

module.exports = router;
