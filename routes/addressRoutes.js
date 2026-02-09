const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

// 获取用户地址列表
router.get('/', addressController.getAddresses);

// 获取单个地址详情
router.get('/:id', addressController.getAddress);

// 添加新地址
router.post('/', addressController.addAddress);

// 编辑地址
router.put('/:id', addressController.updateAddress);

// 删除地址
router.delete('/:id', addressController.deleteAddress);

// 设置默认地址
router.post('/:id/default', addressController.setDefaultAddress);

module.exports = router;
