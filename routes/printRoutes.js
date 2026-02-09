const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const { Order } = require('../models');
const escposPrintService = require('../services/escposPrintService');

/**
 * @route POST /api/print/receipt/:orderId
 * @desc 打印小票
 * @access Private (Admin)
 */
router.post('/receipt/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { printerType = 'usb' } = req.body;

    // 获取订单详情
    const order = await Order.findByPk(orderId, {
      include: ['items']
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    // 打印小票
    const result = await escposPrintService.printReceipt(order.toJSON(), printerType);
    
    res.json({ success: true, message: '小票打印成功' });
  } catch (error) {
    console.error('打印小票失败:', error);
    res.status(500).json({ success: false, message: '打印失败', error: error.message });
  }
});

/**
 * @route POST /api/print/label/:orderId
 * @desc 打印标签
 * @access Private (Admin)
 */
router.post('/label/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemIndex = 0, printerType = 'usb' } = req.body;

    // 获取订单详情
    const order = await Order.findByPk(orderId, {
      include: ['items']
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const orderData = order.toJSON();
    
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ success: false, message: '订单没有商品' });
    }

    const item = orderData.items[itemIndex];
    if (!item) {
      return res.status(400).json({ success: false, message: '商品不存在' });
    }

    // 打印标签
    const totalLabels = orderData.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    await escposPrintService.printLabel(orderData, item, 1, totalLabels, printerType);
    
    res.json({ success: true, message: '标签打印成功' });
  } catch (error) {
    console.error('打印标签失败:', error);
    res.status(500).json({ success: false, message: '打印失败', error: error.message });
  }
});

/**
 * @route POST /api/print/order/:orderId
 * @desc 打印订单（小票+所有标签）
 * @access Private (Admin)
 */
router.post('/order/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { printerType = 'usb' } = req.body;

    // 获取订单详情
    const order = await Order.findByPk(orderId, {
      include: ['items']
    });

    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    // 打印订单
    const result = await escposPrintService.printOrder(order.toJSON(), printerType);
    
    if (result.success) {
      res.json({ success: true, message: '订单打印成功' });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('打印订单失败:', error);
    res.status(500).json({ success: false, message: '打印失败', error: error.message });
  }
});

/**
 * @route POST /api/print/test
 * @desc 测试打印机连接
 * @access Private (Admin)
 */
router.post('/test', authenticateAdmin, async (req, res) => {
  try {
    const { printerType = 'usb' } = req.body;
    
    const result = await escposPrintService.testPrinter(printerType);
    res.json(result);
  } catch (error) {
    console.error('打印机测试失败:', error);
    res.status(500).json({ success: false, message: '打印机测试失败', error: error.message });
  }
});

/**
 * @route GET /api/print/config
 * @desc 获取打印机配置
 * @access Private (Admin)
 */
router.get('/config', authenticateAdmin, async (req, res) => {
  try {
    const config = {
      usb: {
        vid: escposPrintService.PRINTER_CONFIG.usb.vid,
        pid: escposPrintService.PRINTER_CONFIG.usb.pid,
      },
      network: {
        host: escposPrintService.PRINTER_CONFIG.network.host,
        port: escposPrintService.PRINTER_CONFIG.network.port,
      }
    };
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('获取打印机配置失败:', error);
    res.status(500).json({ success: false, message: '获取配置失败', error: error.message });
  }
});

/**
 * @route PUT /api/print/config
 * @desc 更新打印机配置
 * @access Private (Admin)
 */
router.put('/config', authenticateAdmin, async (req, res) => {
  try {
    const { usb, network } = req.body;
    
    if (usb) {
      if (usb.vid) escposPrintService.PRINTER_CONFIG.usb.vid = usb.vid;
      if (usb.pid) escposPrintService.PRINTER_CONFIG.usb.pid = usb.pid;
    }
    
    if (network) {
      if (network.host) escposPrintService.PRINTER_CONFIG.network.host = network.host;
      if (network.port) escposPrintService.PRINTER_CONFIG.network.port = network.port;
    }
    
    res.json({ success: true, message: '打印机配置已更新' });
  } catch (error) {
    console.error('更新打印机配置失败:', error);
    res.status(500).json({ success: false, message: '更新配置失败', error: error.message });
  }
});

module.exports = router;
