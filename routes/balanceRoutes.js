const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');

// 获取用户余额记录
router.get('/records/user/:userId', balanceController.getUserBalanceRecords);

// 获取所有余额记录（管理员）
router.get('/records', balanceController.getAllBalanceRecords);

module.exports = router;
