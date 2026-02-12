/**
 * 打印 API 路由
 * 提供网络打印接口
 */

const express = require('express');
const router = express.Router();
const NetworkPrinter = require('../lib/network-printer');

// 打印机配置（从环境变量或数据库读取）
let printerConfig = {
  host: process.env.PRINTER_HOST || '192.168.1.100',
  port: process.env.PRINTER_PORT || 9100,
  width: 48
};

/**
 * 获取打印机配置
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      host: printerConfig.host,
      port: printerConfig.port,
      width: printerConfig.width
    }
  });
});

/**
 * 更新打印机配置
 */
router.post('/config', (req, res) => {
  const { host, port, width } = req.body;
  
  if (host) printerConfig.host = host;
  if (port) printerConfig.port = port;
  if (width) printerConfig.width = width;
  
  res.json({
    success: true,
    message: '配置已更新',
    data: printerConfig
  });
});

/**
 * 测试打印机连接
 */
router.get('/test-connection', async (req, res) => {
  try {
    const printer = new NetworkPrinter(printerConfig);
    await printer.connect();
    res.json({
      success: true,
      message: '打印机连接成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '打印机连接失败',
      error: error.message
    });
  }
});

/**
 * 打印测试页
 */
router.post('/test', async (req, res) => {
  try {
    const printer = new NetworkPrinter(printerConfig);
    const result = await printer.printTest();
    res.json(result);
  } catch (error) {
    console.error('打印测试页失败:', error);
    res.status(500).json({
      success: false,
      message: '打印失败',
      error: error.message
    });
  }
});

/**
 * 打印订单
 */
router.post('/order', async (req, res) => {
  try {
    const orderData = req.body;
    
    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: '订单数据不能为空'
      });
    }
    
    const printer = new NetworkPrinter(printerConfig);
    const result = await printer.printReceipt(orderData);
    
    res.json(result);
  } catch (error) {
    console.error('打印订单失败:', error);
    res.status(500).json({
      success: false,
      message: '打印失败',
      error: error.message
    });
  }
});

/**
 * 打印订单（通过订单ID）
 */
router.post('/order/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 从数据库获取订单信息
    const db = req.app.locals.db;
    const order = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 获取订单商品
    const items = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM order_items WHERE order_id = ?', [id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // 构建打印数据
    const printData = {
      storeName: '奶茶店',
      orderNo: order.order_no,
      createTime: order.created_at,
      items: items.map(item => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        specs: item.specs ? JSON.parse(item.specs) : []
      })),
      subtotal: order.subtotal,
      discount: order.discount || 0,
      total: order.total,
      payType: order.pay_type,
      payTime: order.paid_at
    };
    
    const printer = new NetworkPrinter(printerConfig);
    const result = await printer.printReceipt(printData);
    
    res.json(result);
  } catch (error) {
    console.error('打印订单失败:', error);
    res.status(500).json({
      success: false,
      message: '打印失败',
      error: error.message
    });
  }
});

module.exports = router;
