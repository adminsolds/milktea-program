const express = require('express');
const router = express.Router();
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
 * 接收外卖平台的状态回调
 * POST /api/delivery/callback
 * 
 * 半夏配送会在以下情况调用此接口：
 * - 订单状态变更（已接单、配送中、已送达等）
 * - 骑手位置更新
 * - 订单取消
 */
router.post('/callback', async (req, res) => {
  try {
    const { app_key, order_no, status, status_text, rider_info, timestamp, sign } = req.body;

    console.log('[外卖回调] 收到状态通知:', { order_no, status, status_text });

    // 根据app_key查找平台配置
    const platform = await DeliveryPlatform.findOne({
      where: { app_key, is_active: true }
    });

    if (!platform) {
      console.error('[外卖回调] 平台未找到:', app_key);
      return res.status(404).json({ code: 404, message: 'Platform not found' });
    }

    // 验证签名
    const validation = await validateCallback(req, platform);
    if (!validation.valid) {
      console.error('[外卖回调] 签名验证失败');
      return res.status(403).json({ code: 403, message: 'Invalid signature' });
    }

    // 查找订单
    const order = await Order.findOne({
      where: { platform_order_no: order_no }
    });

    if (!order) {
      console.error('[外卖回调] 订单未找到:', order_no);
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    // 更新订单状态
    const updateData = {
      platform_status: status,
      platform_status_text: status_text,
      status_updated_at: new Date()
    };

    // 根据状态更新配送信息
    if (status === 'accepted') {
      updateData.delivery_status = 'accepted';
    } else if (status === 'delivering') {
      updateData.delivery_status = 'delivering';
    } else if (status === 'completed') {
      updateData.delivery_status = 'completed';
      updateData.status = 6; // 已送达
    } else if (status === 'cancelled') {
      updateData.delivery_status = 'cancelled';
    }

    // 更新骑手信息
    if (rider_info) {
      updateData.rider_name = rider_info.name || order.rider_name;
      updateData.rider_phone = rider_info.phone || order.rider_phone;
    }

    await order.update(updateData);

    console.log('[外卖回调] 订单状态更新成功:', { order_no, status });

    // 返回成功响应
    res.json({
      code: 0,
      message: 'success',
      data: {
        received_time: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[外卖回调] 处理失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

module.exports = router;
