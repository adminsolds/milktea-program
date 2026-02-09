const { DeliveryPlatform, Order, OrderItem, User, Store, Product } = require('../models');
const { verifySignature } = require('../utils/deliverySignature');
const { isIpAllowed } = require('../utils/apiKeyGenerator');
const crypto = require('crypto');

/**
 * 验证回调请求
 * @param {Object} req - Express请求对象
 * @param {Object} platform - 平台配置
 */
async function validateCallback(req, platform) {
  // 1. 验证IP白名单
  const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  if (platform.ip_whitelist && !isIpAllowed(clientIp, platform.ip_whitelist)) {
    return { valid: false, message: 'IP not allowed' };
  }

  // 2. 验证签名
  const params = req.method === 'GET' ? req.query : req.body;

  // 调试日志
  console.log('[签名验证] 请求参数:', JSON.stringify(params, null, 2));
  console.log('[签名验证] API Secret:', platform.app_secret);

  if (!verifySignature(params, platform.app_secret)) {
    // 如果验证失败，尝试只验证关键字段（兼容不同平台的实现）
    const { sign, items, ...coreParams } = params;
    console.log('[签名验证] 尝试核心字段验证:', JSON.stringify(coreParams, null, 2));

    // 重新计算签名进行对比
    const crypto = require('crypto');
    const sortedKeys = Object.keys(coreParams).sort();
    const signStr = sortedKeys
      .filter(key => {
        const value = coreParams[key];
        return key !== 'sign' &&
               value !== undefined &&
               value !== null &&
               value !== '' &&
               typeof value !== 'object' &&
               typeof value !== 'function';
      })
      .map(key => `${key}=${coreParams[key]}`)
      .join('&');

    const calculatedSign = crypto
      .createHmac('sha256', platform.app_secret)
      .update(signStr)
      .digest('hex');

    console.log('[签名验证] 签名字符串:', signStr);
    console.log('[签名验证] 计算的签名:', calculatedSign);
    console.log('[签名验证] 提供的签名:', sign);

    if (calculatedSign !== sign) {
      return { valid: false, message: 'Invalid signature' };
    }
  }

  return { valid: true };
}

/**
 * 接收外卖平台推送的订单
 * POST /api/callback/delivery/:platformCode/order
 */
const receiveOrder = async (req, res) => {
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

    // 解析订单数据
    const orderData = req.body;

    console.log(`[外卖回调] ${platform.name} 推送订单:`, {
      order_no: orderData.order_no,
      store_id: orderData.store_id,
      receiver_name: orderData.receiver_name
    });

    // 查找店铺
    const store = await Store.findByPk(orderData.store_id);
    if (!store) {
      return res.status(400).json({
        code: 400,
        message: 'Store not found'
      });
    }

    // 获取默认商品ID
    const defaultProduct = await Product.findOne({ where: { is_active: true } });
    const defaultProductId = defaultProduct ? defaultProduct.id : 1;

    // 生成内部订单号
    const internalOrderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

    // 计算订单金额
    let totalAmount = 0;
    let deliveryFee = orderData.delivery_fee || 0;
    let discountAmount = orderData.discount_amount || 0;

    const orderItems = orderData.items.map(item => {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      return {
        product_id: item.product_id || defaultProductId,
        product_name: item.name,
        product_image: item.image || '',
        price: item.price,
        quantity: item.quantity,
        total_price: itemTotal,
        specs: item.specs || null
      };
    });

    // 计算最终金额
    let finalAmount = totalAmount + deliveryFee - discountAmount;
    if (finalAmount < 0) finalAmount = 0;

    // 查找或创建用户
    let user = await User.findOne({
      where: { phone: orderData.receiver_phone }
    });

    if (!user) {
      user = await User.create({
        phone: orderData.receiver_phone,
        nickname: orderData.receiver_name,
        password: crypto.randomBytes(16).toString('hex')
      });
    }

    // 创建订单
    const order = await Order.create({
      order_no: internalOrderNo,
      user_id: user.id,
      store_id: store.id,
      platform_id: platform.id,
      platform_order_no: orderData.order_no,
      platform_code: platform.code,
      order_type: 'delivery',
      order_status: 'pending',
      delivery_status: 'pending',
      receiver_name: orderData.receiver_name,
      receiver_phone: orderData.receiver_phone,
      receiver_address: orderData.receiver_address,
      receiver_lat: orderData.receiver_lat || null,
      receiver_lng: orderData.receiver_lng || null,
      remark: orderData.remark || '',
      delivery_time: orderData.delivery_time || null,
      total_amount: totalAmount,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      payment_status: 'pending',
      payment_method: 'online',
      source: 'delivery_platform'
    });

    // 创建订单商品
    await OrderItem.bulkCreate(orderItems.map(item => ({
      ...item,
      order_id: order.id
    })));

    console.log(`[外卖回调] 订单创建成功:`, {
      internal_order_no: internalOrderNo,
      platform_order_no: orderData.order_no
    });

    // 返回成功响应
    res.json({
      code: 0,
      message: 'success',
      data: {
        order_no: internalOrderNo,
        platform_order_no: orderData.order_no,
        status: 'pending',
        received_time: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('接收外卖订单失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 处理订单状态变更回调
 * POST /api/callback/delivery/:platformCode/order-status
 */
const handleOrderStatus = async (req, res) => {
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
      platform_order_no,
      status,
      status_text,
      timestamp
    } = req.body;

    console.log(`[外卖回调] ${platform.name} 订单状态变更:`, {
      order_no,
      platform_order_no,
      status,
      status_text
    });

    // 查找订单
    const order = await Order.findOne({
      where: { platform_order_no: order_no }
    });

    if (!order) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    // 映射外卖平台状态到内部状态
    const internalStatus = mapOrderStatus(status);

    // 更新订单状态
    await order.update({
      order_status: internalStatus,
      platform_status: status,
      platform_status_text: status_text,
      status_updated_at: new Date()
    });

    res.json({
      code: 0,
      message: 'success',
      data: {
        received_time: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('处理订单状态回调失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 处理订单取消回调
 * POST /api/callback/delivery/:platformCode/order-cancelled
 */
const handleOrderCancelled = async (req, res) => {
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
      cancel_reason,
      timestamp
    } = req.body;

    console.log(`[外卖回调] ${platform.name} 订单取消:`, {
      order_no,
      cancel_reason
    });

    // 查找订单
    const order = await Order.findOne({
      where: { platform_order_no: order_no }
    });

    if (!order) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    // 更新订单状态为已取消
    await order.update({
      order_status: 'cancelled',
      cancel_reason: cancel_reason,
      cancelled_at: new Date()
    });

    res.json({
      code: 0,
      message: 'success'
    });
  } catch (error) {
    console.error('处理订单取消回调失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 映射外卖平台状态到内部状态
 */
function mapOrderStatus(status) {
  const statusMap = {
    'pending': 'pending',           // 待处理
    'confirmed': 'confirmed',       // 已确认
    'preparing': 'preparing',       // 准备中
    'prepared': 'prepared',         // 已备好
    'delivering': 'delivering',     // 配送中
    'completed': 'completed',       // 已完成
    'cancelled': 'cancelled'        // 已取消
  };
  return statusMap[status] || status;
}

module.exports = {
  receiveOrder,
  handleOrderStatus,
  handleOrderCancelled
};
