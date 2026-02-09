const deliveryService = require('./deliveryService');
const { Order, OrderItem, Store, User } = require('../models');

/**
 * 订单处理服务
 * 根据 MINIPROGRAM_INTEGRATION_GUIDE.md 文档实现
 */
class OrderService {
  /**
   * 创建订单并发送配送
   * @param {Object} orderData 订单数据
   * @returns {Promise<Object>} 创建结果
   */
  async createOrder(orderData) {
    try {
      // 1. 保存订单到数据库
      const order = await Order.create({
        order_no: this.generateOrderNo(),
        user_id: orderData.userId,
        store_id: orderData.shopId,
        product_total: orderData.goodsAmount || 0,
        delivery_fee: orderData.deliveryFee || 0,
        final_price: orderData.totalAmount || 0,
        status: 'pending',
        delivery_type: orderData.deliveryType || 'self_pickup',
        address: orderData.customerAddress,
        phone: orderData.customerPhone,
        remark: orderData.remark,
        latitude: orderData.customerLat,
        longitude: orderData.customerLng
      });

      // 2. 保存订单商品
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          total_price: item.price * item.quantity
        }));
        await OrderItem.bulkCreate(orderItems);
      }

      // 3. 如果是配送订单，发送到配送平台
      if (orderData.deliveryType === 'delivery' && orderData.platformCode) {
        const deliveryResult = await deliveryService.createOrder(orderData.platformCode, {
          orderNo: order.order_no,
          shopName: orderData.shopName,
          shopAddress: orderData.shopAddress,
          shopPhone: orderData.shopPhone,
          shopLat: orderData.shopLat,
          shopLng: orderData.shopLng,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerAddress: orderData.customerAddress,
          customerLat: orderData.customerLat,
          customerLng: orderData.customerLng,
          items: orderData.items,
          goodsAmount: orderData.goodsAmount,
          deliveryFee: orderData.deliveryFee,
          totalAmount: orderData.totalAmount,
          remark: orderData.remark
        });

        if (deliveryResult.success) {
          // 更新订单配送信息
          await order.update({
            delivery_order_no: deliveryResult.deliveryOrderNo,
            delivery_status: 'pending',
            status: 'delivery_pending'
          });

          return {
            success: true,
            order: order.toJSON(),
            deliveryOrderNo: deliveryResult.deliveryOrderNo,
            message: '订单创建成功，已发送配送'
          };
        } else {
          // 配送下单失败，标记为需人工处理
          await order.update({
            delivery_status: 'failed',
            status: 'delivery_failed',
            delivery_error: deliveryResult.message
          });

          return {
            success: false,
            message: `配送下单失败: ${deliveryResult.message}`,
            order: order.toJSON()
          };
        }
      }

      return {
        success: true,
        order: order.toJSON(),
        message: '订单创建成功'
      };
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 处理配送回调
   * @param {Object} callbackData 回调数据
   * @returns {Promise<Object>} 处理结果
   */
  async handleDeliveryCallback(callbackData) {
    try {
      const {
        external_order_no,
        order_no,
        status,
        status_text,
        rider_name,
        rider_phone,
        rider_lat,
        rider_lng
      } = callbackData;

      console.log('收到配送回调:', {
        订单号: external_order_no,
        配送订单号: order_no,
        状态: status_text,
        骑手: rider_name
      });

      // 查找订单
      const order = await Order.findOne({
        where: { order_no: external_order_no }
      });

      if (!order) {
        console.error('订单不存在:', external_order_no);
        return { code: -1, message: '订单不存在' };
      }

      // 更新订单状态
      const statusMap = {
        'pending': 'delivery_pending',      // 待接单
        'accepted': 'delivery_accepted',    // 已接单
        'picked_up': 'delivery_picked_up',  // 已取货
        'delivering': 'delivering',         // 配送中
        'completed': 'delivery_completed',  // 已送达
        'cancelled': 'delivery_cancelled'   // 已取消
      };

      const updateData = {
        delivery_status: statusMap[status] || status,
        rider_name: rider_name || order.rider_name,
        rider_phone: rider_phone || order.rider_phone,
        rider_lat: rider_lat || order.rider_lat,
        rider_lng: rider_lng || order.rider_lng
      };

      // 根据状态更新订单状态和时间
      if (status === 'accepted') {
        updateData.accepted_at = new Date();
      } else if (status === 'picked_up') {
        updateData.picked_up_at = new Date();
      } else if (status === 'completed') {
        updateData.status = 'completed';
        updateData.delivered_at = new Date();
      } else if (status === 'cancelled') {
        updateData.status = 'cancelled';
        updateData.cancelled_at = new Date();
      }

      await order.update(updateData);

      // 发送微信订阅消息通知用户（可选）
      await this.notifyUser(order.user_id, status_text, rider_name);

      return { code: 0, message: 'success' };
    } catch (error) {
      console.error('处理配送回调失败:', error);
      return { code: -1, message: error.message };
    }
  }

  /**
   * 通知用户（微信订阅消息）
   * @param {String} userId 用户ID
   * @param {String} status 状态文本
   * @param {String} riderName 骑手姓名
   */
  async notifyUser(userId, status, riderName) {
    try {
      // 这里调用微信API发送订阅消息
      console.log(`通知用户${userId}: 配送状态${status}, 骑手${riderName}`);
      // TODO: 实现微信订阅消息发送
    } catch (error) {
      console.error('通知用户失败:', error);
    }
  }

  /**
   * 生成订单号
   * @returns {String} 订单号
   */
  generateOrderNo() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `NC${dateStr}${randomStr}`;
  }

  /**
   * 查询订单配送状态
   * @param {String} orderNo 订单号
   * @returns {Promise<Object>} 订单状态
   */
  async getOrderDeliveryStatus(orderNo) {
    try {
      const order = await Order.findOne({
        where: { order_no: orderNo },
        attributes: ['order_no', 'delivery_order_no', 'delivery_status', 'rider_name', 'rider_phone', 'rider_lat', 'rider_lng']
      });

      if (!order) {
        return { code: -1, message: '订单不存在' };
      }

      return {
        code: 0,
        data: {
          orderNo: order.order_no,
          deliveryOrderNo: order.delivery_order_no,
          status: order.delivery_status,
          riderName: order.rider_name,
          riderPhone: order.rider_phone,
          riderLat: order.rider_lat,
          riderLng: order.rider_lng
        }
      };
    } catch (error) {
      console.error('查询配送状态失败:', error);
      return { code: -1, message: error.message };
    }
  }
}

module.exports = new OrderService();
