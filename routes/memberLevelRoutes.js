const express = require('express');
const router = express.Router();
const memberLevelController = require('../controllers/memberLevelController');

// 会员等级相关路由
router.get('/', memberLevelController.getMemberLevels);
router.get('/:id', memberLevelController.getMemberLevelById);
router.post('/', memberLevelController.createMemberLevel);
router.put('/:id', memberLevelController.updateMemberLevel);
router.delete('/:id', memberLevelController.deleteMemberLevel);

module.exports = router;