const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const activityController = require('../controllers/activityController');

// 获取活动列表
router.get('/', authenticate, activityController.getActivities);

// 参与抽奖
router.post('/:id/lottery', authenticate, activityController.participateLottery);

// 领取生日福利
router.post('/birthday/receive', authenticate, activityController.receiveBirthdayWelfare);

// 检查会员日
router.get('/member-day/check', authenticate, activityController.checkMemberDay);

module.exports = router;
