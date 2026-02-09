const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// 优惠券相关路由
router.get('/', couponController.getCoupons);
router.get('/:id', couponController.getCouponById);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);
router.get('/users/:userId', couponController.getUserCoupons);
router.post('/users/:userId/:couponId', couponController.grantCouponToUser);

module.exports = router;