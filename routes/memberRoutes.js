const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// API路由 - 注意：具体路由要放在参数路由之前，避免被错误匹配
router.get('/members', memberController.getMembers);
router.post('/members', memberController.createMember);
router.get('/members/search', memberController.searchMembers);
router.get('/members/phone/:phone', memberController.getMemberByPhone);
router.get('/members/:id', memberController.getMemberById);
router.put('/members/:id', memberController.updateMember);
router.delete('/members/:id', memberController.deleteMember);
router.put('/members/:id/growth', memberController.updateMemberGrowth);

module.exports = router;
