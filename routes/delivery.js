const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const { DeliveryPlatform, Order } = require('../models');
const { verifySignature } = require('../utils/deliverySignature');

/**
 * 验证回调请求
 */
async function validateCallback(req, platform) {
  // 验证签名
  const params = req.body;
  if (!verifySignature(params, platform.app_secret)) {
    return { valid: false, message: 'Invalid signature' };
  }
  return { valid: true };
}

/**
 * 接收配送平台回调
 * POST /api/delivery/callback
 * 
 * 配送平台会在以下情况调用此接口：
 * - 订单状态变更（已接单、配送中、已送达等）
 * - 骑手位置更新
 * - 订单取消
 */
router.post('/callback', async (req, res) => {
  try {
    const { app_key, order_no, external_order_no, status, status_text, rider_info, timestamp, sign } = req.body;

    console.log('[配送回调] 收到状态通知:', { order_no, external_order_no, status, status_text });

    // 根据app_key查找平台配置
    const platform = await DeliveryPlatform.findOne({
      where: { app_key, is_active: true }
    });

    if (!platform) {
      console.error('[配送回调] 平台未找到:', app_key);
      return res.status(404).json({ code: 404, message: 'Platform not found' });
    }

    // 验证签名
    const validation = await validateCallback(req, platform);
    if (!validation.valid) {
      console.error('[配送回调] 签名验证失败');
      return res.status(403).json({ code: 403, message: 'Invalid signature' });
    }

    // 处理回调数据
    const callbackData = {
      external_order_no: external_order_no || req.body.external_order_no,
      order_no: order_no,
      status: status,
      status_text: status_text,
      rider_name: rider_info?.name || req.body.rider_name,
      rider_phone: rider_info?.phone || req.body.rider_phone,
      rider_lat: req.body.rider_lat,
      rider_lng: req.body.rider_lng
    };

    // 调用订单服务处理回调
    const result = await orderService.handleDeliveryCallback(callbackData);

    console.log('[配送回调] 处理结果:', result);

    // 返回成功响应（必须返回 code: 0，否则配送平台会重试）
    res.json(result);
  } catch (error) {
    console.error('[配送回调] 处理失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

/**
 * 查询订单配送状态
 * GET /api/delivery/status/:orderNo
 */
router.get('/status/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params;

    const result = await orderService.getOrderDeliveryStatus(orderNo);

    res.json(result);
  } catch (error) {
    console.error('查询配送状态失败:', error);
    res.status(500).json({ code: -1, message: error.message });
  }
});

module.exports = router;
