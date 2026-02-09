const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 用户相关路由 - 必须放在 /:id 之前
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);
router.get('/points', userController.getUserPoints);
router.post('/login', userController.login);
router.post('/phone', userController.updateUserPhone); // 更新用户手机号
router.post('/decrypt-phone', userController.decryptPhone); // 解密手机号

// 管理员用户管理路由
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;