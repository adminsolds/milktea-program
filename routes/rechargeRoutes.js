const express = require('express');
const router = express.Router();
const rechargeController = require('../controllers/rechargeController');

// 储值方案相关路由
router.get('/plans', rechargeController.getRechargePlans);
router.post('/plans', rechargeController.addRechargePlan);
router.put('/plans/:id', rechargeController.updateRechargePlan);
router.delete('/plans/:id', rechargeController.deleteRechargePlan);
router.patch('/plans/:id/toggle', rechargeController.toggleRechargePlanStatus);

// 储值记录相关路由
router.get('/records', rechargeController.getRechargeRecords);
router.get('/records/user/:userId', rechargeController.getUserRechargeRecords);
router.post('/admin-recharge', rechargeController.adminRecharge);
router.post('/custom-recharge', rechargeController.customRecharge);

// 小程序端储值路由
router.post('/create-order', rechargeController.createRechargeOrder);
router.post('/confirm-payment', rechargeController.confirmPayment);
router.post('/simple-recharge', rechargeController.simpleRecharge);

module.exports = router;