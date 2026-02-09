const { DeliveryPlatform, Order, OrderItem, Store, User } = require('../models');
const deliveryService = require('../services/deliveryService');
const { convertInternalOrderToDelivery } = require('../utils/orderConverter');

// 获取所有外卖平台列表
const getPlatforms = async (req, res) => {
  try {
    const platforms = await DeliveryPlatform.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      platforms
    });
  } catch (error) {
    console.error('获取外卖平台列表失败:', error);
    res.status(500).json({ success: false, message: '获取外卖平台列表失败' });
  }
};

// 获取所有平台（包括禁用的）- 后台管理用
const getAllPlatforms = async (req, res) => {
  try {
    const platforms = await DeliveryPlatform.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      platforms
    });
  } catch (error) {
    console.error('获取外卖平台列表失败:', error);
    res.status(500).json({ success: false, message: '获取外卖平台列表失败' });
  }
};

// 获取单个平台详情
const getPlatformById = async (req, res) => {
  try {
    const { id } = req.params;
    const platform = await DeliveryPlatform.findByPk(id);
    
    if (!platform) {
      return res.status(404).json({ success: false, message: '平台不存在' });
    }
    
    res.json({
      success: true,
      platform
    });
  } catch (error) {
    console.error('获取外卖平台详情失败:', error);
    res.status(500).json({ success: false, message: '获取外卖平台详情失败' });
  }
};

// 创建外卖平台
const createPlatform = async (req, res) => {
  try {
    const {
      name,
      code,
      platform_type,
      icon,
      api_url,
      web_url,
      app_url,
      merchant_id,
      app_key,
      app_secret,
      callback_url,
      ip_whitelist,
      rate_limit,
      is_active,
      sort_order,
      config
    } = req.body;
    
    // 验证必填字段
    if (!name || !code) {
      return res.status(400).json({ success: false, message: '平台名称和代码为必填项' });
    }
    
    // 检查code是否已存在
    const existingPlatform = await DeliveryPlatform.findOne({ where: { code } });
    if (existingPlatform) {
      return res.status(400).json({ success: false, message: '平台代码已存在' });
    }
    
    const platform = await DeliveryPlatform.create({
      name,
      code,
      platform_type: platform_type || 'third_party',
      icon,
      api_url,
      web_url,
      app_url,
      merchant_id,
      app_key,
      app_secret,
      callback_url,
      ip_whitelist,
      rate_limit: rate_limit || 100,
      is_active: is_active !== undefined ? is_active : true,
      sort_order: sort_order || 0,
      config
    });
    
    res.json({
      success: true,
      message: '创建成功',
      platform
    });
  } catch (error) {
    console.error('创建外卖平台失败:', error);
    res.status(500).json({ success: false, message: '创建外卖平台失败' });
  }
};

// 更新外卖平台
const updatePlatform = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      platform_type,
      icon,
      api_url,
      web_url,
      app_url,
      merchant_id,
      app_key,
      app_secret,
      callback_url,
      ip_whitelist,
      rate_limit,
      is_active,
      sort_order,
      config
    } = req.body;
    
    const platform = await DeliveryPlatform.findByPk(id);
    if (!platform) {
      return res.status(404).json({ success: false, message: '平台不存在' });
    }
    
    // 如果修改了code，检查是否与其他平台冲突
    if (code && code !== platform.code) {
      const existingPlatform = await DeliveryPlatform.findOne({ where: { code } });
      if (existingPlatform) {
        return res.status(400).json({ success: false, message: '平台代码已存在' });
      }
    }
    
    await platform.update({
      name: name || platform.name,
      code: code || platform.code,
      platform_type: platform_type !== undefined ? platform_type : platform.platform_type,
      icon: icon !== undefined ? icon : platform.icon,
      api_url: api_url !== undefined ? api_url : platform.api_url,
      web_url: web_url !== undefined ? web_url : platform.web_url,
      app_url: app_url !== undefined ? app_url : platform.app_url,
      merchant_id: merchant_id !== undefined ? merchant_id : platform.merchant_id,
      app_key: app_key !== undefined ? app_key : platform.app_key,
      app_secret: app_secret !== undefined ? app_secret : platform.app_secret,
      callback_url: callback_url !== undefined ? callback_url : platform.callback_url,
      ip_whitelist: ip_whitelist !== undefined ? ip_whitelist : platform.ip_whitelist,
      rate_limit: rate_limit !== undefined ? rate_limit : platform.rate_limit,
      is_active: is_active !== undefined ? is_active : platform.is_active,
      sort_order: sort_order !== undefined ? sort_order : platform.sort_order,
      config: config !== undefined ? config : platform.config
    });
    
    res.json({
      success: true,
      message: '更新成功',
      platform
    });
  } catch (error) {
    console.error('更新外卖平台失败:', error);
    res.status(500).json({ success: false, message: '更新外卖平台失败' });
  }
};

// 删除外卖平台
const deletePlatform = async (req, res) => {
  try {
    const { id } = req.params;
    const platform = await DeliveryPlatform.findByPk(id);
    
    if (!platform) {
      return res.status(404).json({ success: false, message: '平台不存在' });
    }
    
    await platform.destroy();
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除外卖平台失败:', error);
    res.status(500).json({ success: false, message: '删除外卖平台失败' });
  }
};

// 发送订单到配送平台（实际实现）
const sendOrderToPlatform = async (req, res) => {
  try {
    const { platformId } = req.params;
    const { orderId, orderData } = req.body;
    
    // 获取平台配置
    const platform = await DeliveryPlatform.findByPk(platformId);
    if (!platform) {
      return res.status(404).json({ success: false, message: '平台不存在' });
    }
    
    if (!platform.is_active) {
      return res.status(400).json({ success: false, message: '该平台已禁用' });
    }

    let deliveryOrderData;

    // 如果直接传入了订单数据，使用传入的数据
    if (orderData) {
      deliveryOrderData = orderData;
    } else if (orderId) {
      // 否则从数据库获取订单信息
      const order = await Order.findByPk(orderId, {
        include: [{
          model: OrderItem,
          as: 'items'
        }]
      });

      if (!order) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }

      // 获取店铺信息
      const store = await Store.findByPk(order.store_id);
      
      // 获取用户信息
      const user = await User.findByPk(order.user_id);
      
      // 转换订单格式
      deliveryOrderData = convertInternalOrderToDelivery(order, store, user);
    } else {
      return res.status(400).json({ success: false, message: '请提供 orderId 或 orderData' });
    }
    
    // 发送到配送平台
    const result = await deliveryService.sendOrder(platform.code, deliveryOrderData);
    
    res.json({
      success: true,
      message: `订单已成功发送到${platform.name}`,
      data: result
    });
  } catch (error) {
    console.error('发送订单到配送平台失败:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '发送订单到配送平台失败' 
    });
  }
};

// 查询配送订单状态
const queryDeliveryStatus = async (req, res) => {
  try {
    const { platformId, deliveryOrderNo } = req.params;
    
    const platform = await DeliveryPlatform.findByPk(platformId);
    if (!platform) {
      return res.status(404).json({ success: false, message: '平台不存在' });
    }
    
    const status = await deliveryService.queryOrderStatus(platform.code, deliveryOrderNo);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('查询配送状态失败:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '查询配送状态失败' 
    });
  }
};

// 取消配送订单
const cancelDeliveryOrder = async (req, res) => {
  try {
    const { platformId, deliveryOrderNo } = req.params;
    const { reason } = req.body;
    
    const platform = await DeliveryPlatform.findByPk(platformId);
    if (!platform) {
      return res.status(404).json({ success: false, message: '平台不存在' });
    }
    
    await deliveryService.cancelOrder(platform.code, deliveryOrderNo, reason);
    
    res.json({
      success: true,
      message: '配送订单已取消'
    });
  } catch (error) {
    console.error('取消配送订单失败:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '取消配送订单失败' 
    });
  }
};

// 测试签名生成
const testSignature = async (req, res) => {
  try {
    const { platformId } = req.params;
    
    const platform = await DeliveryPlatform.findByPk(platformId);
    if (!platform) {
      return res.status(404).json({ success: false, message: '平台不存在' });
    }
    
    const result = await deliveryService.testSignature(platform.code);
    
    res.json({
      success: true,
      message: '签名生成成功',
      data: result
    });
  } catch (error) {
    console.error('测试签名生成失败:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '测试签名生成失败' 
    });
  }
};

// 获取外卖平台链接（用于跳转到外部平台）
const getPlatformLinks = async (req, res) => {
  try {
    const platforms = await DeliveryPlatform.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'code', 'icon', 'web_url', 'app_url'],
      order: [['sort_order', 'ASC']]
    });
    
    res.json({
      success: true,
      platforms: platforms.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        icon: p.icon,
        web_url: p.web_url,
        app_url: p.app_url
      }))
    });
  } catch (error) {
    console.error('获取外卖平台链接失败:', error);
    res.status(500).json({ success: false, message: '获取外卖平台链接失败' });
  }
};

module.exports = {
  getPlatforms,
  getAllPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform,
  sendOrderToPlatform,
  queryDeliveryStatus,
  cancelDeliveryOrder,
  testSignature,
  getPlatformLinks
};
