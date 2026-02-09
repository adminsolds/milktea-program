const express = require('express');
const router = express.Router();
const groupBuyController = require('../controllers/groupBuyController');

// 团购活动相关路由
router.get('/list', groupBuyController.getGroupBuys); // 兼容前端的/list路径
router.get('/', groupBuyController.getGroupBuys);
router.get('/update-status', groupBuyController.updateGroupBuyStatus);
router.get('/:id', groupBuyController.getGroupBuyById);
router.get('/:id/participants', groupBuyController.getGroupBuyParticipants);
router.post('/', groupBuyController.createGroupBuy);
router.put('/:id', groupBuyController.updateGroupBuy);
router.delete('/:id', groupBuyController.deleteGroupBuy);

module.exports = router;
