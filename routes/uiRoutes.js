const express = require('express');
const router = express.Router();
const uiController = require('../controllers/uiController');
const { authenticateAdmin } = require('../middleware/auth');

// UI相关路由
router.get('/banners', uiController.getBanners);
router.get('/banners/:id', uiController.getBannerById);
router.post('/banners', authenticateAdmin, uiController.createBanner);
router.put('/banners/:id', authenticateAdmin, uiController.updateBanner);
router.delete('/banners/:id', authenticateAdmin, uiController.deleteBanner);

router.get('/function-entries', uiController.getFunctionEntries);
router.get('/function-entries/:id', uiController.getFunctionEntryById);
router.post('/function-entries', authenticateAdmin, uiController.createFunctionEntry);
router.put('/function-entries/:id', authenticateAdmin, uiController.updateFunctionEntry);
router.delete('/function-entries/:id', authenticateAdmin, uiController.deleteFunctionEntry);

router.get('/new-products', uiController.getNewProducts);
router.get('/new-products/:id', uiController.getNewProductById);
router.post('/new-products', authenticateAdmin, uiController.createNewProduct);
router.put('/new-products/:id', authenticateAdmin, uiController.updateNewProduct);
router.delete('/new-products/:id', authenticateAdmin, uiController.deleteNewProduct);

// 用户页面配置相关路由
router.get('/user-page-config', uiController.getUserPageConfig);
router.post('/user-page-config', authenticateAdmin, uiController.updateUserPageConfig);

// 主题配置相关路由
router.get('/theme-config', uiController.getThemeConfig);
router.post('/theme-config', authenticateAdmin, uiController.updateThemeConfig);

module.exports = router;