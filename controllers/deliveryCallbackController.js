const { DeliveryPlatform, Order } = require('../models');
const { verifySignature } = require('../utils/deliverySignature');
const { isIpAllowed } = require('../utils/apiKeyGenerator');

/**
 * 验证回调请求
 * @param {Object} req - Express请求对象
 * @param {Object} platform - 平台配置
 */
async function validateCallback(req, platform) {
  // 1. 验证IP白名单
  const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  if (!isIpAllowed(clientIp, platform.ip_whitelist)) {
    return { valid: false, message: 'IP not allowed' };
  }

  // 2. 验证签名
  const params = req.method === 'GET' ? req.query : req.body;
  if (!verifySignature(params, platform.app_secret)) {
    return { valid: false, message: 'Invalid signature' };
  }

  return { valid: true };
}

/**
 * 处理订单状态变更回调
 * POST /api/callback/delivery/:platformCode/order-status
 */
const handleOrderStatusCallback = async (req, res) => {
  try {
    const { platformCode } = req.params;

    // 获取平台配置
    const platform = await DeliveryPlatform.findOne({
      where: { code: platformCode, is_active: true }
    });

    if (!platform) {
      return res.status(404).json({ code: 404, message: 'Platform not found' });
    }

    // 验证请求
    const validation = await validateCallback(req, platform);
    if (!validation.valid) {
      return res.status(403).json({ code: 403, message: validation.message });
    }

    // 解析回调数据
    const {
      order_no,
      external_order_no,
      status,
      status_text,
      rider_name,
      rider_phone,
      rider_lat,
      rider_lng,
      timestamp
    } = req.body;

    console.log(`[配送回调] ${platform.name} 订单状态变更:`, {
      order_no,
      external_order_no,
      status,
      status_text
    });

    // 查找内部订单
    const order = await Order.findOne({
      where: { order_no: external_order_no }
    });

    if (!order) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    // 更新订单配送状态
    const deliveryStatus = mapDeliveryStatus(status);
    await order.update({
      delivery_status: deliveryStatus,
      delivery_order_no: order_no,
      rider_name: rider_name || order.rider_name,
      rider_phone: rider_phone || order.rider_phone,
      rider_lat: rider_lat || order.rider_lat,
      rider_lng: rider_lng || order.rider_lng,
      delivery_updated_at: new Date()
    });

    // 记录配送状态日志
    await logDeliveryStatus(order.id, platform.id, status, status_text, req.body);

    // 返回成功响应
    res.json({
      code: 0,
      message: 'success',
      data: {
        received_time: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('处理配送状态回调失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 处理骑手位置更新回调
 * POST /api/callback/delivery/:platformCode/rider-location
 */
const handleRiderLocationCallback = async (req, res) => {
  try {
    const { platformCode } = req.params;

    const platform = await DeliveryPlatform.findOne({
      where: { code: platformCode, is_active: true }
    });

    if (!platform) {
      return res.status(404).json({ code: 404, message: 'Platform not found' });
    }

    // 验证请求
    const validation = await validateCallback(req, platform);
    if (!validation.valid) {
      return res.status(403).json({ code: 403, message: validation.message });
    }

    const {
      order_no,
      external_order_no,
      rider_lat,
      rider_lng,
      timestamp
    } = req.body;

    // 更新订单骑手位置
    const order = await Order.findOne({
      where: { order_no: external_order_no }
    });

    if (order) {
      await order.update({
        rider_lat,
        rider_lng,
        location_updated_at: new Date()
      });
    }

    res.json({
      code: 0,
      message: 'success'
    });
  } catch (error) {
    console.error('处理骑手位置回调失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 处理配送异常回调
 * POST /api/callback/delivery/:platformCode/exception
 */
const handleExceptionCallback = async (req, res) => {
  try {
    const { platformCode } = req.params;

    const platform = await DeliveryPlatform.findOne({
      where: { code: platformCode, is_active: true }
    });

    if (!platform) {
      return res.status(404).json({ code: 404, message: 'Platform not found' });
    }

    // 验证请求
    const validation = await validateCallback(req, platform);
    if (!validation.valid) {
      return res.status(403).json({ code: 403, message: validation.message });
    }

    const {
      order_no,
      external_order_no,
      exception_type,
      exception_desc,
      timestamp
    } = req.body;

    console.log(`[配送异常] ${platform.name}:`, {
      order_no,
      exception_type,
      exception_desc
    });

    // 更新订单异常状态
    const order = await Order.findOne({
      where: { order_no: external_order_no }
    });

    if (order) {
      await order.update({
        delivery_exception: exception_desc,
        delivery_exception_type: exception_type,
        exception_time: new Date()
      });
    }

    res.json({
      code: 0,
      message: 'success'
    });
  } catch (error) {
    console.error('处理配送异常回调失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 处理订单取消回调
 * POST /api/callback/delivery/:platformCode/order-cancelled
 */
const handleOrderCancelledCallback = async (req, res) => {
  try {
    const { platformCode } = req.params;

    const platform = await DeliveryPlatform.findOne({
      where: { code: platformCode, is_active: true }
    });

    if (!platform) {
      return res.status(404).json({ code: 404, message: 'Platform not found' });
    }

    // 验证请求
    const validation = await validateCallback(req, platform);
    if (!validation.valid) {
      return res.status(403).json({ code: 403, message: validation.message });
    }

    const {
      order_no,
      external_order_no,
      cancel_reason,
      timestamp
    } = req.body;

    console.log(`[配送取消] ${platform.name}:`, {
      order_no,
      cancel_reason
    });

    // 更新订单状态为配送取消
    const order = await Order.findOne({
      where: { order_no: external_order_no }
    });

    if (order) {
      await order.update({
        delivery_status: 'cancelled',
        cancel_reason: cancel_reason,
        cancelled_at: new Date()
      });
    }

    res.json({
      code: 0,
      message: 'success'
    });
  } catch (error) {
    console.error('处理配送取消回调失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 映射配送状态到内部状态
 */
function mapDeliveryStatus(status) {
  const statusMap = {
    'pending': 'pending',           // 待接单
    'accepted': 'accepted',         // 已接单
    'arrived_shop': 'arrived_shop', // 已到店
    'picked_up': 'picked_up',       // 已取货
    'delivering': 'delivering',     // 配送中
    'arrived': 'arrived',           // 已送达
    'completed': 'completed',       // 已完成
    'cancelled': 'cancelled'        // 已取消
  };
  return statusMap[status] || status;
}

/**
 * 记录配送状态日志
 */
async function logDeliveryStatus(orderId, platformId, status, statusText, rawData) {
  // 这里可以实现日志记录，如写入数据库或发送到日志服务
  console.log(`[配送日志] 订单:${orderId} 平台:${platformId} 状态:${status}(${statusText})`);
}

module.exports = {
  handleOrderStatusCallback,
  handleRiderLocationCallback,
  handleExceptionCallback,
  handleOrderCancelledCallback
};
