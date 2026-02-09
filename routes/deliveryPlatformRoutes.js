const express = require('express');
const router = express.Router();
const deliveryPlatformController = require('../controllers/deliveryPlatformController');
// 外卖平台路由

// 获取启用的外卖平台列表（小程序端用）
router.get('/', deliveryPlatformController.getPlatforms);

// 获取所有外卖平台列表（后台管理用）
router.get('/all', deliveryPlatformController.getAllPlatforms);

// 获取外卖平台链接
router.get('/links', deliveryPlatformController.getPlatformLinks);

// 获取单个平台详情
router.get('/:id', deliveryPlatformController.getPlatformById);

// 创建外卖平台
router.post('/', deliveryPlatformController.createPlatform);

// 更新外卖平台
router.put('/:id', deliveryPlatformController.updatePlatform);

// 删除外卖平台
router.delete('/:id', deliveryPlatformController.deletePlatform);

// 发送订单到外卖平台
router.post('/:platformId/send-order', deliveryPlatformController.sendOrderToPlatform);

// 查询配送订单状态
router.get('/:platformId/delivery-status/:deliveryOrderNo', deliveryPlatformController.queryDeliveryStatus);

// 取消配送订单
router.post('/:platformId/cancel-delivery/:deliveryOrderNo', deliveryPlatformController.cancelDeliveryOrder);

// 测试签名生成
router.post('/:platformId/test-signature', deliveryPlatformController.testSignature);

module.exports = router;
