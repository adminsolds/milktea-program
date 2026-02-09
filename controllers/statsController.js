const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');
const { Order, OrderItem, Product, User } = require('../models');

// 获取销售统计
const getSalesStats = async (req, res) => {
  try {
    const { start_date, end_date, group_by } = req.query;
    
    const where = {};
    if (start_date) where.created_at = { [Op.gte]: new Date(start_date) };
    if (end_date) where.created_at = { ...where.created_at, [Op.lte]: new Date(end_date) };
    
    // 统计已支付和已完成的订单
    where.status = { [Op.in]: [1, 4] };
    
    // 查询销售数据
    const salesData = await Order.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('SUM', sequelize.col('final_price')), 'total_sales'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'order_count']
      ],
      group: ['date'],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });
    
    const totalSales = salesData.reduce((sum, item) => sum + parseFloat(item.dataValues.total_sales), 0);
    const totalOrders = salesData.reduce((sum, item) => sum + item.dataValues.order_count, 0);

    res.json({
      success: true,
      data: {
        revenue: totalSales,
        orderCount: totalOrders,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
        memberRevenue: 0,  // TODO: 统计会员消费
        newMembers: 0,     // TODO: 统计新增会员
        pendingOrders: 0   // TODO: 统计待处理订单
      }
    });
  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// 获取订单统计
const getOrderStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const where = {
      status: { [Op.in]: [1, 4, 5] } // 已支付、配送中、已完成
    };
    if (start_date) where.created_at = { [Op.gte]: new Date(start_date) };
    if (end_date) where.created_at = { ...where.created_at, [Op.lte]: new Date(end_date) };

    // 查询各订单类型的数量和金额
    // 堂食：POS现场点单 (is_pos = true) 或 自取订单
    // 外卖：delivery 订单

    // 堂食订单（POS现场点单）
    const dineInStats = await Order.findAll({
      where: {
        ...where,
        [Op.or]: [
          { is_pos: true },
          { order_type: 'self' }
        ]
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('final_price')), 'amount']
      ],
      raw: true
    });

    // 自取订单
    const takeoutStats = await Order.findAll({
      where: {
        ...where,
        order_type: 'pickup'
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('final_price')), 'amount']
      ],
      raw: true
    });

    // 外卖订单
    const deliveryStats = await Order.findAll({
      where: {
        ...where,
        order_type: 'delivery'
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('final_price')), 'amount']
      ],
      raw: true
    });

    // 查询订单总数和总金额
    const totalStats = await Order.findAll({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('final_price')), 'amount']
      ],
      raw: true
    });

    const dineInCount = parseInt(dineInStats[0]?.count || 0);
    const dineInAmount = parseFloat(dineInStats[0]?.amount || 0);
    const takeoutCount = parseInt(takeoutStats[0]?.count || 0);
    const takeoutAmount = parseFloat(takeoutStats[0]?.amount || 0);
    const deliveryCount = parseInt(deliveryStats[0]?.count || 0);
    const deliveryAmount = parseFloat(deliveryStats[0]?.amount || 0);
    const totalOrders = parseInt(totalStats[0]?.count || 0);
    const totalAmount = parseFloat(totalStats[0]?.amount || 0);

    res.json({
      success: true,
      data: {
        totalOrders: totalOrders,
        totalRevenue: totalAmount,
        averageOrderValue: totalOrders > 0 ? totalAmount / totalOrders : 0,
        dineInCount: dineInCount,
        dineInAmount: dineInAmount,
        takeoutCount: takeoutCount,
        takeoutAmount: takeoutAmount,
        deliveryCount: deliveryCount,
        deliveryAmount: deliveryAmount
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// 获取商品统计
const getProductStats = async (req, res) => {
  try {
    const { start_date, end_date, limit = 10 } = req.query;
    
    // 构建订单查询条件（只统计已支付和已完成的订单）
    const orderWhere = {
      status: { [Op.in]: [1, 4] } // 已支付和已完成
    };
    if (start_date) orderWhere.created_at = { [Op.gte]: new Date(start_date) };
    if (end_date) orderWhere.created_at = { ...orderWhere.created_at, [Op.lte]: new Date(end_date) };
    
    // 查询销量前N的商品
    const topProducts = await OrderItem.findAll({
      include: [{
        model: Order,
        as: 'order',
        where: orderWhere,
        attributes: []
      }],
      attributes: [
        'product_id',
        'product_name',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('SUM', sequelize.literal('price * quantity')), 'total_sales']
      ],
      group: ['product_id', 'product_name'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: parseInt(limit),
      raw: false
    });
    
    // 查询商品总数
    const totalProducts = await Product.count();
    
    res.json({
      total_products: totalProducts,
      products: topProducts.map(item => ({
        product_id: item.dataValues.product_id,
        product_name: item.dataValues.product_name,
        total_quantity: parseInt(item.dataValues.total_quantity),
        total_sales: parseFloat(item.dataValues.total_sales)
      }))
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取用户统计
const getUserStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const where = {};
    if (start_date) where.created_at = { [Op.gte]: new Date(start_date) };
    if (end_date) where.created_at = { ...where.created_at, [Op.lte]: new Date(end_date) };
    
    // 查询用户总数
    const totalUsers = await User.count();
    
    // 查询新增用户数
    const newUsers = await User.count({ where });
    
    // 查询用户增长趋势
    const userGrowth = await User.findAll({
      where,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['date'],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });
    
    res.json({
      total_users: totalUsers,
      new_users: newUsers,
      user_growth: userGrowth.map(item => ({
        date: item.dataValues.date,
        count: item.dataValues.count
      }))
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSalesStats,
  getOrderStats,
  getProductStats,
  getUserStats
};