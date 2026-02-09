const express = require('express');
const router = express.Router();
const tabBarIconController = require('../controllers/tabBarIconController');
const { authenticateAdmin } = require('../middleware/auth');

// TabBar 图标相关路由
router.get('/', tabBarIconController.getTabBarIcons);
router.get('/:id', tabBarIconController.getTabBarIconById);
router.post('/', authenticateAdmin, tabBarIconController.createTabBarIcon);
router.put('/:id', authenticateAdmin, tabBarIconController.updateTabBarIcon);
router.delete('/:id', authenticateAdmin, tabBarIconController.deleteTabBarIcon);
router.put('/batch/order', authenticateAdmin, tabBarIconController.updateTabBarOrder);

module.exports = router;
