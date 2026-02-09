const express = require('express')
const router = express.Router()
const systemConfigController = require('../controllers/systemConfigController')

// 获取所有系统配置(公开API,无需认证)
router.get('/public', systemConfigController.getSystemConfigs)

// 获取单个配置(公开API,无需认证)
router.get('/public/:key', systemConfigController.getSystemConfig)

module.exports = router
