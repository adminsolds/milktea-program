const { Order, OrderItem, User, Store, MemberLevel, SystemConfig, UserCoupon, Coupon } = require('../models');
const { autoUpgradeMemberLevel } = require('./memberController');
const { calculateMemberDiscount, calculateFinalPrice } = require('../utils/discountUtils');
const { sendOrderToPlatform } = require('../services/foodDeliveryService');
const { createBalanceRecord } = require('./balanceController');

// 获取订单列表
const getOrders = async (req, res) => {
  try {
    const { user_id, status, page = 1, limit = 10, startDate, endDate, source, is_pos } = req.query;

    console.log('获取订单列表参数:', { user_id, status, page, limit, startDate, endDate, source, is_pos });

    const where = {};
    if (user_id) where.user_id = user_id;
    if (status !== undefined && status !== '') where.status = status;
    if (source) where.source = source;
    if (is_pos !== undefined) where.is_pos = is_pos === 'true';

    // 日期范围筛选
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[require('sequelize').Op.gte] = startDate + ' 00:00:00';
      }
      if (endDate) {
        where.created_at[require('sequelize').Op.lte] = endDate + ' 23:59:59';
      }
    }

    console.log('查询条件:', where);

    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'phone']
        },
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'address', 'phone']
        },
        {
          model: OrderItem,
          as: 'items'
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    console.log('查询到的订单数量:', count);

    // 动态计算全额支付金额并添加到订单对象中
    const ordersWithFullPayment = rows.map(order => {
      // 全额支付金额 = 商品总价 + 配送费
      const full_payment_amount = parseFloat(order.product_total) + parseFloat(order.delivery_fee);

      // 转换为驼峰命名并添加动态计算字段
      const orderData = order.toJSON();
      return {
        ...orderData,
        full_payment_amount,
        // 转换时间字段为驼峰命名
        createdAt: orderData.created_at,
        updatedAt: orderData.updated_at,
        deletedAt: orderData.deleted_at,
        payTime: orderData.pay_time,
        completeTime: orderData.complete_time,
        // 添加用户信息
        userName: order.user?.nickname || null,
        userPhone: order.user?.phone || null,
        // 添加店铺信息
        storeName: order.store?.name || null,
        storeAddress: order.store?.address || null,
        storePhone: order.store?.phone || null
      };
    });

    console.log('订单列表:', ordersWithFullPayment);

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      orders: ordersWithFullPayment
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取订单详情
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'phone']
        },
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'address', 'phone']
        },
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 转换为驼峰命名
    const orderData = order.toJSON();
    const orderWithCamelCase = {
      ...orderData,
      // 转换时间字段为驼峰命名
      createdAt: orderData.created_at,
      updatedAt: orderData.updated_at,
      deletedAt: orderData.deleted_at,
      payTime: orderData.pay_time,
      completeTime: orderData.complete_time
    };

    res.json(orderWithCamelCase);
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建订单
const createOrder = async (req, res) => {
  try {
    console.log('收到创建订单请求:', req.body);

    const {
      user_id,
      store_id,
      remark,
      product_total,
      delivery_fee,
      discount = 0,
      coupon_id,
      payment_method,
      phone,
      items,
      order_type = 'self',
      platform_code,
      receiver_name,
      receiver_phone,
      receiver_address,
      receiver_lat,
      receiver_lng,
      // 自取预约信息
      is_pickup,
      pickup_time,
      pickup_minutes,
      // POS现场点单相关
      is_pos,
      member_discount
    } = req.body;

    console.log('解析后的订单数据:', { user_id, store_id, product_total, payment_method, items_count: items?.length, order_type, platform_code, is_pos });

    // 验证必填字段
    if (!store_id || !product_total || !payment_method || !items || items.length === 0) {
      console.error('缺少必填字段:', { user_id, store_id, product_total, payment_method, items });
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // 如果是现场点单，不需要user_id
    if (!is_pos && !user_id) {
      console.error('非POS订单缺少用户ID');
      return res.status(400).json({ error: 'User ID is required for non-POS orders' });
    }

    let memberDiscountInfo = { discount: 0 };
    let final_user_id = user_id;

    // POS订单通过手机号查找会员
    if (is_pos && phone) {
      try {
        // 使用User模型查找会员（会员信息存储在users表中）
        const member = await User.findOne({
          where: { phone }
        });

        if (member) {
          final_user_id = member.id;
          // 如果前端已计算会员折扣，使用前端的值
          if (member_discount) {
            memberDiscountInfo.discount = member_discount;
            console.log('使用前端计算的会员折扣:', member_discount);
          } else {
            // 否则通过会员等级计算
            const memberLevels = await MemberLevel.findAll({ where: { is_active: 1 } });
            memberDiscountInfo = calculateMemberDiscount(member, product_total, memberLevels);
          }
        } else {
          console.log('未找到手机号为', phone, '的会员');
        }
      } catch (error) {
        console.error('查找会员失败:', error);
      }
    } else if (user_id) {
      // 获取用户信息
      const user = await User.findByPk(user_id);
      if (!user) {
        console.error('用户不存在:', user_id);
        return res.status(404).json({ error: 'User not found' });
      }

      // 获取所有会员等级
      const memberLevels = await MemberLevel.findAll({ where: { is_active: 1 } });

      // 计算会员折扣
      memberDiscountInfo = calculateMemberDiscount(user, product_total, memberLevels);
    }

    console.log('会员折扣计算结果:', memberDiscountInfo);

    // 计算最终价格
    const hasCoupon = coupon_id != null
    const final_price = calculateFinalPrice(
      product_total,
      delivery_fee || 0,
      discount,
      memberDiscountInfo.discount,
      hasCoupon
    );
    console.log('最终价格:', final_price, '使用优惠券:', hasCoupon);

    // 生成订单号
    const order_no = 'MX' + Date.now();

    // 创建订单
    const order = await Order.create({
      order_no,
      user_id: final_user_id || null,
      store_id,
      remark,
      product_total,
      delivery_fee: delivery_fee || 0,
      discount,
      member_discount: hasCoupon ? 0 : memberDiscountInfo.discount,
      final_price,
      coupon_id,
      payment_method,
      status: 1, // 已下单
      phone,
      order_type: is_pickup ? 'pickup' : order_type,
      platform_code,
      receiver_name,
      receiver_phone,
      receiver_address,
      receiver_lat,
      receiver_lng,
      // 自取预约信息
      is_pickup: is_pickup || false,
      pickup_time: pickup_time || null,
      pickup_minutes: pickup_minutes || null,
      // POS订单标识
      is_pos: is_pos || false
    });
    console.log('订单创建成功:', order.id);

    // 创建订单商品
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      spec: item.spec,
      sugar: item.sugar,
      ice: item.ice,
      toppings: typeof item.toppings === 'string' ? item.toppings : JSON.stringify(item.toppings || []),
      product_image: item.product_image || null
    }));

    await OrderItem.bulkCreate(orderItems);
    console.log('订单商品创建成功:', orderItems.length);

    // 如果是储值支付，扣减用户余额
    if (payment_method === 'wallet' && final_user_id) {
      try {
        const user = await User.findByPk(final_user_id);
        if (user) {
          const currentBalance = parseFloat(user.balance) || 0;
          if (currentBalance >= final_price) {
            const newBalance = currentBalance - final_price;
            await user.update({ balance: newBalance.toFixed(2) });
            console.log('储值支付扣减成功:', { userId: final_user_id, oldBalance: currentBalance, newBalance, deducted: final_price });

            // 创建余额记录
            await createBalanceRecord({
              user_id: final_user_id,
              type: 'consumption',
              amount: -final_price,
              balance: newBalance,
              remark: `订单消费: ${order_no}`,
              order_id: order.id
            });
          } else {
            console.error('储值余额不足:', { userId: final_user_id, currentBalance, required: final_price });
          }
        }
      } catch (error) {
        console.error('储值支付扣减失败:', error);
      }
    }

    // 返回完整订单信息
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    // 动态计算全额支付金额并添加到订单对象中
    const orderWithFullPayment = {
      ...completeOrder.toJSON(),
      full_payment_amount: parseFloat(completeOrder.product_total) + parseFloat(completeOrder.delivery_fee)
    };

    // 如果是外卖订单，发送到外卖平台
    if (req.body.order_type === 'delivery' && req.body.platform_code) {
      console.log('检测到外卖订单，准备发送到外卖平台:', req.body.platform_code);
      try {
        const deliveryResult = await sendOrderToPlatform(completeOrder, req.body.platform_code);
        if (deliveryResult.success) {
          console.log('订单已发送到外卖平台:', deliveryResult.data);
          orderWithFullPayment.delivery_platform_order = deliveryResult.data;
        } else {
          console.error('发送订单到外卖平台失败:', deliveryResult.message);
          orderWithFullPayment.delivery_error = deliveryResult.message;
        }
      } catch (deliveryError) {
        console.error('发送订单到外卖平台异常:', deliveryError);
        orderWithFullPayment.delivery_error = deliveryError.message;
      }
    }

    res.status(201).json({
      success: true,
      data: orderWithFullPayment,
      message: '订单创建成功'
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
};

// 更新订单状态
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 统一状态码定义
    // 0: 已取消, 1: 已下单, 2: 制作中, 3: 制作完成, 4: 配送中/待取餐, 5: 已完成, 6: 已送达
    // 更新订单状态
    await order.update({
      status,
      ...(status === 1 && { pay_time: new Date() }), // 如果状态是已下单，设置支付时间
      ...(status === 5 && { complete_time: new Date() }), // 如果状态是已完成，设置完成时间
      ...(status === 6 && { complete_time: new Date() }) // 如果状态是已送达，设置完成时间
    });

    // 订单完成后更新用户成长值和积分（状态5或6）
    if (status === 5 || status === 6) {
      try {
        const user = await User.findByPk(order.user_id);
        if (user) {
          // 从系统配置获取成长值和积分转换比例
          const growthRateConfig = await SystemConfig.findOne({ where: { key: 'growth_rate' } });
          const pointsRateConfig = await SystemConfig.findOne({ where: { key: 'points_rate' } });

          // 解析配置,默认为1
          const growthRate = growthRateConfig ? JSON.parse(growthRateConfig.value).rate : 1;
          const pointsRate = pointsRateConfig ? JSON.parse(pointsRateConfig.value).rate : 1;

          // 根据订单金额和配置比例计算成长值和积分
          const growthToAdd = Math.floor(order.final_price / growthRate);
          const pointsToAdd = Math.floor(order.final_price / pointsRate);

          // 更新用户成长值和积分
          await user.update({
            growth_value: user.growth_value + growthToAdd,
            points: user.points + pointsToAdd
          });

          // 自动升级会员等级
          await autoUpgradeMemberLevel(user.id);

          console.log(`订单 ${order.id} 完成，用户 ${user.id} 获得 ${growthToAdd} 成长值和 ${pointsToAdd} 积分`);
        }
      } catch (error) {
        console.error('更新用户成长值和积分失败:', error);
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 订单退款
const refundOrder = async (req, res) => {
  const t = await Order.sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason = '管理员操作退款' } = req.body;

    console.log('开始处理订单退款:', { orderId: id, reason });

    // 获取订单信息
    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ],
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ error: '订单不存在' });
    }

    // 检查订单状态：只能退款已支付但未完成的订单
    // 状态说明: 0已取消, 1已下单, 2制作中, 3制作完成, 4配送中/待取餐, 5已完成, 6已送达
    if (order.status === 0) {
      await t.rollback();
      return res.status(400).json({ error: '订单已取消，无需退款' });
    }
    if (order.status === 5) {
      await t.rollback();
      return res.status(400).json({ error: '订单已完成，无法退款' });
    }

    // 计算退款金额（使用最终支付价格）
    const refundAmount = parseFloat(order.final_price) || 0;

    if (refundAmount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: '退款金额必须大于0' });
    }

    // 更新订单状态为已取消
    await order.update({
      status: 0,
      cancel_reason: reason,
      cancelled_at: new Date()
    }, { transaction: t });

    console.log('订单状态已更新为已取消');

    // 退款到用户余额
    if (order.user && order.user.id) {
      const currentBalance = parseFloat(order.user.balance) || 0;
      const newBalance = currentBalance + refundAmount;

      await order.user.update({
        balance: newBalance.toFixed(2)
      }, { transaction: t });

      console.log('用户余额已更新:', { userId: order.user.id, oldBalance: currentBalance, newBalance });

      // 创建余额记录
      await createBalanceRecord(
        order.user.id,
        'refund',
        refundAmount,
        'order',
        order.id,
        `订单退款：${order.order_no}`
      );

      console.log('余额记录已创建');
    }

    // 如果使用了优惠券，恢复优惠券
    if (order.coupon_id) {
      const userCoupon = await UserCoupon.findOne({
        where: {
          user_id: order.user_id,
          coupon_id: order.coupon_id
        },
        transaction: t
      });

      if (userCoupon) {
        await userCoupon.update({
          status: 'unused',
          use_time: null
        }, { transaction: t });
        console.log('优惠券已恢复:', userCoupon.id);
      }
    }

    await t.commit();

    console.log('订单退款成功:', { orderId: id, refundAmount });

    res.json({
      success: true,
      message: '退款成功',
      refund_amount: refundAmount,
      new_balance: order.user ? parseFloat(order.user.balance) + refundAmount : 0
    });

  } catch (error) {
    await t.rollback();
    console.error('Refund order error:', error);
    res.status(500).json({ error: '退款失败: ' + error.message });
  }
};

// 获取订单统计数据
const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate, source } = req.query;

    const where = {
      status: { [require('sequelize').Op.in]: [1, 2, 3, 4, 5, 6] } // 排除已取消的订单
    };

    if (startDate) {
      where.created_at = { ...where.created_at, [require('sequelize').Op.gte]: startDate + ' 00:00:00' };
    }
    if (endDate) {
      where.created_at = { ...where.created_at, [require('sequelize').Op.lte]: endDate + ' 23:59:59' };
    }
    if (source) {
      where.source = source;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('final_price')), 'amount']
      ],
      raw: true
    });

    res.json({
      count: parseInt(count) || 0,
      amount: parseFloat(rows[0]?.amount || 0).toFixed(2)
    });
  } catch (error) {
    console.error('获取订单统计失败:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  refundOrder,
  getOrderStats
};