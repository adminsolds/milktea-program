const { SuspendedOrder, Store } = require('../models');

// 生成挂起单号
const generateSuspendedNo = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SUS${timestamp}${random}`;
};

// 挂起订单控制器
const suspendedOrderController = {
  // 创建挂起订单
  async createSuspendedOrder(req, res) {
    try {
      const {
        store_id,
        cart_data,
        member_phone,
        order_type,
        remark
      } = req.body;

      if (!store_id || !cart_data || cart_data.length === 0) {
        return res.status(400).json({
          success: false,
          error: '缺少必填字段'
        });
      }

      const suspended_order = await SuspendedOrder.create({
        suspended_no: generateSuspendedNo(),
        store_id,
        cart_data,
        member_phone: member_phone || '',
        order_type: order_type || 'dine_in',
        remark: remark || ''
      });

      res.json({
        success: true,
        suspended_order
      });
    } catch (error) {
      console.error('创建挂起订单失败:', error);
      res.status(500).json({
        success: false,
        error: '创建挂起订单失败',
        message: error.message
      });
    }
  },

  // 获取挂起订单列表
  async getSuspendedOrders(req, res) {
    try {
      const { store_id } = req.query;

      const where = { is_restored: false };
      if (store_id) {
        where.store_id = store_id;
      }

      const suspended_orders = await SuspendedOrder.findAll({
        where,
        include: [{
          model: Store,
          as: 'store',
          attributes: ['id', 'name']
        }],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        suspended_orders
      });
    } catch (error) {
      console.error('获取挂起订单列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取挂起订单列表失败'
      });
    }
  },

  // 恢复挂起订单
  async restoreSuspendedOrder(req, res) {
    try {
      const { id } = req.params;

      const suspended_order = await SuspendedOrder.findByPk(id);
      if (!suspended_order) {
        return res.status(404).json({
          success: false,
          error: '挂起订单不存在'
        });
      }

      if (suspended_order.is_restored) {
        return res.status(400).json({
          success: false,
          error: '该订单已被恢复'
        });
      }

      await suspended_order.update({ is_restored: true });

      res.json({
        success: true,
        suspended_order
      });
    } catch (error) {
      console.error('恢复挂起订单失败:', error);
      res.status(500).json({
        success: false,
        error: '恢复挂起订单失败'
      });
    }
  },

  // 删除挂起订单
  async deleteSuspendedOrder(req, res) {
    try {
      const { id } = req.params;

      const suspended_order = await SuspendedOrder.findByPk(id);
      if (!suspended_order) {
        return res.status(404).json({
          success: false,
          error: '挂起订单不存在'
        });
      }

      await suspended_order.destroy();

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除挂起订单失败:', error);
      res.status(500).json({
        success: false,
        error: '删除挂起订单失败'
      });
    }
  }
};

module.exports = suspendedOrderController;
