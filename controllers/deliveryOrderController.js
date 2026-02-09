const { DeliveryPlatform, Order, OrderItem, User, Store, Product } = require('../models');
const { verifySignature } = require('../utils/deliverySignature');
const { isIpAllowed } = require('../utils/apiKeyGenerator');
const { v4: uuidv4 } = require('uuid');

/**
 * 验证配送平台请求
 */
async function validatePlatformRequest(req, platformCode) {
  // 获取平台配置
  const platform = await DeliveryPlatform.findOne({
    where: { code: platformCode, is_active: true }
  });

  if (!platform) {
    return { valid: false, code: 404, message: 'Platform not found' };
  }

  // 验证IP白名单
  const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  if (!isIpAllowed(clientIp, platform.ip_whitelist)) {
    return { valid: false, code: 403, message: 'IP not allowed: ' + clientIp };
  }

  // 验证签名
  const params = req.method === 'GET' ? req.query : req.body;
  if (!verifySignature(params, platform.app_secret)) {
    return { valid: false, code: 403, message: 'Invalid signature' };
  }

  return { valid: true, platform };
}

/**
 * 接收配送订单
 * POST /api/delivery/:platformCode/order
 */
const receiveDeliveryOrder = async (req, res) => {
  try {
    const { platformCode } = req.params;
    const validation = await validatePlatformRequest(req, platformCode);

    if (!validation.valid) {
      return res.status(validation.code).json({
        code: validation.code,
        message: validation.message
      });
    }

    const platform = validation.platform;
    const orderData = req.body;

    console.log(`[配送订单] 收到来自 ${platform.name} 的订单:`, orderData.order_no);

    // 验证必填字段
    const requiredFields = ['order_no', 'store_id', 'receiver_name', 'receiver_phone', 'receiver_address', 'items'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return res.status(400).json({
          code: 400,
          message: `Missing required field: ${field}`
        });
      }
    }

    // 查找或创建用户
    let user = await User.findOne({ where: { phone: orderData.receiver_phone } });
    if (!user) {
      user = await User.create({
        phone: orderData.receiver_phone,
        nickname: orderData.receiver_name,
        source: 'delivery_platform',
        source_platform: platform.code
      });
    }

    // 查找店铺
    const store = await Store.findByPk(orderData.store_id);
    if (!store) {
      return res.status(400).json({
        code: 400,
        message: 'Store not found'
      });
    }

    // 获取一个默认商品ID（用于外键约束）
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

    const finalAmount = totalAmount + deliveryFee - discountAmount;

    // 创建订单
    const order = await Order.create({
      order_no: internalOrderNo,
      user_id: user.id,
      store_id: store.id,
      platform_id: platform.id,
      platform_order_no: orderData.order_no,
      platform_code: platform.code,
      order_type: 'delivery',
      order_status: 'pending', // 待处理
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
      payment_method: 'online', // 默认在线支付
      source: 'delivery_platform'
    });

    // 创建订单商品
    await OrderItem.bulkCreate(orderItems.map(item => ({
      ...item,
      order_id: order.id
    })));

    console.log(`[配送订单] 创建成功: ${internalOrderNo}`);

    // 返回成功响应
    res.json({
      code: 0,
      message: 'success',
      data: {
        order_no: orderData.order_no,
        internal_order_no: internalOrderNo,
        status: 'pending',
        created_at: order.created_at
      }
    });
  } catch (error) {
    console.error('接收配送订单失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 查询订单状态
 * GET /api/delivery/:platformCode/order/:orderNo
 */
const queryOrderStatus = async (req, res) => {
  try {
    const { platformCode, orderNo } = req.params;
    const validation = await validatePlatformRequest(req, platformCode);

    if (!validation.valid) {
      return res.status(validation.code).json({
        code: validation.code,
        message: validation.message
      });
    }

    const order = await Order.findOne({
      where: { platform_order_no: orderNo }
    });

    if (!order) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        order_no: order.platform_order_no,
        internal_order_no: order.order_no,
        order_status: order.order_status,
        delivery_status: order.delivery_status,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        final_amount: order.final_amount,
        created_at: order.created_at,
        updated_at: order.updated_at
      }
    });
  } catch (error) {
    console.error('查询订单状态失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 取消订单
 * POST /api/delivery/:platformCode/order/:orderNo/cancel
 */
const cancelOrder = async (req, res) => {
  try {
    const { platformCode, orderNo } = req.params;
    const { reason } = req.body;
    const validation = await validatePlatformRequest(req, platformCode);

    if (!validation.valid) {
      return res.status(validation.code).json({
        code: validation.code,
        message: validation.message
      });
    }

    const order = await Order.findOne({
      where: { platform_order_no: orderNo }
    });

    if (!order) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    // 检查订单是否可以取消
    if (order.order_status === 'completed' || order.order_status === 'cancelled') {
      return res.status(400).json({
        code: 400,
        message: 'Order cannot be cancelled'
      });
    }

    await order.update({
      order_status: 'cancelled',
      cancel_reason: reason || 'Cancelled by platform',
      cancelled_at: new Date()
    });

    res.json({
      code: 0,
      message: 'success',
      data: {
        order_no: orderNo,
        status: 'cancelled',
        cancelled_at: order.cancelled_at
      }
    });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 确认订单
 * POST /api/delivery/:platformCode/order/:orderNo/confirm
 */
const confirmOrder = async (req, res) => {
  try {
    const { platformCode, orderNo } = req.params;
    const validation = await validatePlatformRequest(req, platformCode);

    if (!validation.valid) {
      return res.status(validation.code).json({
        code: validation.code,
        message: validation.message
      });
    }

    const order = await Order.findOne({
      where: { platform_order_no: orderNo }
    });

    if (!order) {
      return res.status(404).json({ code: 404, message: 'Order not found' });
    }

    if (order.order_status !== 'pending') {
      return res.status(400).json({
        code: 400,
        message: 'Order cannot be confirmed'
      });
    }

    await order.update({
      order_status: 'confirmed',
      confirmed_at: new Date()
    });

    res.json({
      code: 0,
      message: 'success',
      data: {
        order_no: orderNo,
        status: 'confirmed',
        confirmed_at: order.confirmed_at
      }
    });
  } catch (error) {
    console.error('确认订单失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

/**
 * 获取店铺列表（供配送平台选择）
 * GET /api/delivery/:platformCode/stores
 */
const getStores = async (req, res) => {
  try {
    const { platformCode } = req.params;
    const validation = await validatePlatformRequest(req, platformCode);

    if (!validation.valid) {
      return res.status(validation.code).json({
        code: validation.code,
        message: validation.message
      });
    }

    const stores = await Store.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'address', 'phone', 'lat', 'lng', 'business_hours']
    });

    res.json({
      code: 0,
      message: 'success',
      data: stores
    });
  } catch (error) {
    console.error('获取店铺列表失败:', error);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
};

module.exports = {
  receiveDeliveryOrder,
  queryOrderStatus,
  cancelOrder,
  confirmOrder,
  getStores
};
