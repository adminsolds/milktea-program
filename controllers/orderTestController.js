const { Order, OrderItem, User, Store } = require('../models');
const { sendOrderToPlatform } = require('../services/foodDeliveryService');

// 生成测试订单号
const generateTestOrderNo = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TEST${timestamp}${random}`;
};

// 订单测试控制器
const orderTestController = {
  // 创建测试订单
  async createTestOrder(req, res) {
    try {
      const {
        store_id = 1,
        platform_code = 'meituan',
        order_type = 'delivery',
        payment_method = 'wechat',
        product_count = 2,
        with_delivery = true
      } = req.body;

      console.log('创建测试订单请求:', { store_id, platform_code, order_type, payment_method, product_count, with_delivery });

      // 验证店铺是否存在
      const store = await Store.findByPk(store_id);
      if (!store) {
        return res.status(404).json({
          success: false,
          error: '店铺不存在'
        });
      }

      // 生成测试商品数据
      const testItems = [];
      for (let i = 1; i <= product_count; i++) {
        testItems.push({
          product_id: i,
          product_name: `测试商品${i}`,
          price: 15 + i,
          quantity: 1,
          spec: '中杯',
          sugar: '正常糖',
          ice: '正常冰',
          toppings: JSON.stringify(['珍珠', '布丁']),
          product_image: null
        });
      }

      // 计算商品总价
      const product_total = testItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const delivery_fee = with_delivery ? 5 : 0;
      const final_price = product_total + delivery_fee;

      // 生成测试订单号
      const order_no = generateTestOrderNo();

      // 创建订单
      const order = await Order.create({
        order_no,
        user_id: null, // 测试订单不需要真实用户
        store_id,
        remark: '测试订单 - 用于第三方配送平台测试',
        product_total,
        delivery_fee,
        discount: 0,
        member_discount: 0,
        final_price,
        coupon_id: null,
        payment_method,
        status: 1, // 已下单
        phone: '13800138000', // 测试手机号
        order_type,
        platform_code,
        receiver_name: '测试用户',
        receiver_phone: '13800138000',
        receiver_address: '北京市朝阳区测试地址',
        receiver_lat: 39.9042,
        receiver_lng: 116.4074,
        source: 'delivery_platform',
        is_pos: false
      });

      console.log('测试订单创建成功:', order.id);

      // 创建订单商品
      const orderItems = testItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        spec: item.spec,
        sugar: item.sugar,
        ice: item.ice,
        toppings: item.toppings,
        product_image: item.product_image
      }));

      await OrderItem.bulkCreate(orderItems);
      console.log('测试订单商品创建成功:', orderItems.length);

      // 如果是外卖订单，发送到外卖平台
      let deliveryResult = null;
      if (order_type === 'delivery' && platform_code) {
        try {
          // 获取订单的完整信息，包括关联的订单项
          const orderWithItems = await Order.findByPk(order.id, {
            include: [{
              model: OrderItem,
              as: 'items'
            }]
          });
          deliveryResult = await sendOrderToPlatform(orderWithItems, platform_code);
          console.log('测试订单发送到外卖平台:', deliveryResult.success ? '成功' : '失败');
        } catch (error) {
          console.error('发送测试订单到外卖平台失败:', error);
        }
      }

      res.json({
        success: true,
        order,
        delivery_result: deliveryResult,
        message: '测试订单创建成功'
      });
    } catch (error) {
      console.error('创建测试订单失败:', error);
      res.status(500).json({
        success: false,
        error: '创建测试订单失败',
        message: error.message
      });
    }
  },

  // 模拟配送状态更新
  async simulateDeliveryStatusUpdate(req, res) {
    try {
      const { order_id, status, platform_code = 'meituan' } = req.body;

      if (!order_id || !status) {
        return res.status(400).json({
          success: false,
          error: '缺少订单ID和状态参数'
        });
      }

      // 获取订单
      const order = await Order.findByPk(order_id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: '订单不存在'
        });
      }

      // 统一状态码定义
      // 0: 已取消, 1: 已下单, 2: 制作中, 3: 制作完成, 4: 配送中/待取餐, 5: 已完成, 6: 已送达
      const validStatuses = [0, 1, 2, 3, 4, 5, 6];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: '无效的状态值'
        });
      }

      // 更新订单状态
      await order.update({
        status,
        ...(status === 1 && { pay_time: new Date() }),
        ...((status === 5 || status === 6) && { complete_time: new Date() })
      });

      console.log(`测试订单 ${order_id} 状态更新为: ${status}`);

      res.json({
        success: true,
        order,
        message: '配送状态更新成功'
      });
    } catch (error) {
      console.error('模拟配送状态更新失败:', error);
      res.status(500).json({
        success: false,
        error: '模拟配送状态更新失败',
        message: error.message
      });
    }
  },

  // 模拟支付回调
  async simulatePaymentCallback(req, res) {
    try {
      const { order_id, payment_method = 'wechat', success = true } = req.body;

      if (!order_id) {
        return res.status(400).json({
          success: false,
          error: '缺少订单ID参数'
        });
      }

      // 获取订单
      const order = await Order.findByPk(order_id);
      if (!order) {
        return res.status(404).json({
          success: false,
          error: '订单不存在'
        });
      }

      if (success) {
        // 更新订单状态为已支付
        await order.update({
          status: 1, // 已下单（已支付）
          pay_time: new Date()
        });

        console.log(`测试订单 ${order_id} 支付成功`);

        res.json({
          success: true,
          order,
          message: '支付回调模拟成功'
        });
      } else {
        // 模拟支付失败
        console.log(`测试订单 ${order_id} 支付失败`);

        res.json({
          success: false,
          order,
          message: '支付回调模拟失败'
        });
      }
    } catch (error) {
      console.error('模拟支付回调失败:', error);
      res.status(500).json({
        success: false,
        error: '模拟支付回调失败',
        message: error.message
      });
    }
  },

  // 清理测试数据
  async cleanupTestData(req, res) {
    try {
      const { days = 1 } = req.query;

      // 计算清理时间范围
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - days);

      // 查找测试订单（订单号以TEST开头）
      const testOrders = await Order.findAll({
        where: {
          order_no: {
            [require('sequelize').Op.like]: 'TEST%'
          },
          created_at: {
            [require('sequelize').Op.gte]: cutoffTime
          }
        }
      });

      const orderIdsToDelete = testOrders.map(order => order.id);
      const deletedCount = orderIdsToDelete.length;

      if (deletedCount > 0) {
        // 先删除订单商品
        await OrderItem.destroy({
          where: {
            order_id: {
              [require('sequelize').Op.in]: orderIdsToDelete
            }
          }
        });

        // 再删除订单
        await Order.destroy({
          where: {
            id: {
              [require('sequelize').Op.in]: orderIdsToDelete
            }
          }
        });

        console.log(`清理测试数据完成，删除了 ${deletedCount} 个测试订单`);
      }

      res.json({
        success: true,
        deleted_count: deletedCount,
        message: `清理测试数据完成，删除了 ${deletedCount} 个测试订单`
      });
    } catch (error) {
      console.error('清理测试数据失败:', error);
      res.status(500).json({
        success: false,
        error: '清理测试数据失败',
        message: error.message
      });
    }
  },

  // 获取测试订单列表
  async getTestOrders(req, res) {
    try {
      const { limit = 20 } = req.query;

      // 查找测试订单（订单号以TEST开头）
      const testOrders = await Order.findAll({
        where: {
          order_no: {
            [require('sequelize').Op.like]: 'TEST%'
          }
        },
        include: [
          {
            model: OrderItem,
            as: 'items'
          },
          {
            model: Store,
            as: 'store',
            attributes: ['id', 'name']
          }
        ],
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        test_orders: testOrders,
        count: testOrders.length
      });
    } catch (error) {
      console.error('获取测试订单列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取测试订单列表失败',
        message: error.message
      });
    }
  }
};

module.exports = orderTestController;