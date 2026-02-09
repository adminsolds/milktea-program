const express = require('express');
const router = express.Router();
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const memberActivityController = require('../controllers/memberActivityController');

// 后台管理接口（需要管理员权限）
router.get('/admin/activities', authenticateAdmin, memberActivityController.getActivities);
router.get('/admin/activities/:id', authenticateAdmin, memberActivityController.getActivityById);
router.post('/admin/activities', authenticateAdmin, memberActivityController.createActivity);
router.put('/admin/activities/:id', authenticateAdmin, memberActivityController.updateActivity);
router.delete('/admin/activities/:id', authenticateAdmin, memberActivityController.deleteActivity);

// 小程序端接口（需要用户登录）
router.get('/activities', authenticate, memberActivityController.getActiveActivities);
router.post('/activities/:activityId/lottery', authenticate, memberActivityController.participateLottery);
router.post('/activities/birthday/receive', authenticate, memberActivityController.receiveBirthdayBenefit);
router.get('/activities/member-day/check', authenticate, memberActivityController.checkMemberDayActivity);
router.get('/activities/new-product', authenticate, memberActivityController.getNewProductActivities);
router.get('/activities/flash-sale', authenticate, memberActivityController.getFlashSaleActivities);
router.get('/activities/logs', authenticate, memberActivityController.getUserActivityLogs);

module.exports = router;
