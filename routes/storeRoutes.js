const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// 店铺相关路由
router.get('/', storeController.getStores);
router.post('/', storeController.createStore);

// 店铺状态和营业时间路由（必须放在 /:id 路由之前）
router.get('/status', storeController.getStoreStatus);

// 带ID参数的路由
router.get('/:id', storeController.getStoreById);
router.put('/:id', storeController.updateStore);
router.delete('/:id', storeController.deleteStore);
router.put('/:id/status', storeController.updateStoreStatus);
router.put('/:id/hours', storeController.updateStoreHours);

module.exports = router;