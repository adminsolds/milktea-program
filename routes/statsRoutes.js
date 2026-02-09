const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// 数据统计相关路由
router.get('/sales', statsController.getSalesStats);
router.get('/orders', statsController.getOrderStats);
router.get('/products', statsController.getProductStats);
router.get('/users', statsController.getUserStats);

module.exports = router;