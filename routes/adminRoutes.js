const express = require('express');
const router = express.Router();
const { login, register, getAdminInfo } = require('../controllers/adminController');

// 管理员登录
router.post('/login', login);

// 管理员注册（仅用于初始化，建议生产环境禁用）
router.post('/register', register);

// 获取管理员信息
router.get('/info', getAdminInfo);

module.exports = router;