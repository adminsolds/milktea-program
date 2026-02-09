const express = require('express')
const router = express.Router()
const systemConfigController = require('../controllers/systemConfigController')
const { authenticateAdmin } = require('../middleware/auth')

// 初始化默认配置
router.post('/init', authenticateAdmin, systemConfigController.initDefaultSystemConfigs)

// 获取所有配置
router.get('/', authenticateAdmin, systemConfigController.getSystemConfigs)

// 获取单个配置
router.get('/:key', authenticateAdmin, systemConfigController.getSystemConfig)

// 更新单个配置
router.put('/:key', authenticateAdmin, systemConfigController.updateSystemConfig)

// 批量更新配置
router.put('/batch/update', authenticateAdmin, systemConfigController.batchUpdateSystemConfigs)

module.exports = router
