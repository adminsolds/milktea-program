/**
 * 本地打印服务
 * 用于美团点餐机浏览器调用本地打印机
 * 
 * 使用方法：
 * 1. 在美团点餐机上安装 Node.js
 * 2. 运行 npm install 安装依赖
 * 3. 运行 npm start 启动服务
 * 4. 浏览器通过 http://localhost:3001 访问打印服务
 */

const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
const USB = require('escpos-usb');
const Network = require('escpos-network');

const app = express();
const PORT = 3001;

// 启用 CORS，允许浏览器跨域访问
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 打印机配置
const PRINTER_CONFIG = {
  // USB打印机配置
  usb: {
    vid: 0x0483,  // 默认USB VID
    pid: 0x5743,  // 默认USB PID
  },
  // 网络打印机配置
  network: {
    host: '192.168.1.100',
    port: 9100,
  }
};

/**
 * 健康检查接口
 */
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '本地打印服务运行正常',
    timestamp: new Date().toISOString()
  });
});

/**
 * 获取打印机列表
 */
app.get('/printers', async (req, res) => {
  try {
    const printers = [];
    
    // 尝试查找 USB 打印机
    try {
      const devices = USB.findPrinter();
      if (devices && devices.length > 0) {
        devices.forEach((device, index) => {
          printers.push({
            id: `usb-${index}`,
            name: `USB打印机 ${index + 1}`,
            type: 'usb',
            vid: device.deviceDescriptor.idVendor,
            pid: device.deviceDescriptor.idProduct
          });
        });
      }
    } catch (e) {
      console.log('查找USB打印机失败:', e.message);
    }
    
    // 添加网络打印机配置
    printers.push({
      id: 'network-1',
      name: '网络打印机',
      type: 'network',
      host: PRINTER_CONFIG.network.host,
      port: PRINTER_CONFIG.network.port
    });
    
    res.json({
      success: true,
      data: printers
    });
  } catch (error) {
    console.error('获取打印机列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取打印机列表失败',
      error: error.message
    });
  }
});

/**
 * 打印小票接口
 */
app.post('/print/receipt', async (req, res) => {
  try {
    const { order, printerType = 'usb', printerConfig = {} } = req.body;
    
    if (!order) {
      return res.status(400).json({
        success: false,
        message: '缺少订单数据'
      });
    }
    
    // 执行打印
    const result = await printReceipt(order, printerType, printerConfig);
    
    res.json(result);
  } catch (error) {
    console.error('打印小票失败:', error);
    res.status(500).json({
      success: false,
      message: '打印小票失败',
      error: error.message
    });
  }
});

/**
 * 打印标签接口
 */
app.post('/print/labels', async (req, res) => {
  try {
    const { order, items, printerType = 'usb', printerConfig = {} } = req.body;
    
    if (!order || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: '缺少订单数据或商品数据'
      });
    }
    
    // 执行打印
    const result = await printLabels(order, items, printerType, printerConfig);
    
    res.json(result);
  } catch (error) {
    console.error('打印标签失败:', error);
    res.status(500).json({
      success: false,
      message: '打印标签失败',
      error: error.message
    });
  }
});

/**
 * 打印订单（小票+标签）
 */
app.post('/print/order', async (req, res) => {
  try {
    const { order, printerType = 'usb', printerConfig = {} } = req.body;
    
    if (!order) {
      return res.status(400).json({
        success: false,
        message: '缺少订单数据'
      });
    }
    
    // 1. 打印小票
    const receiptResult = await printReceipt(order, printerType, printerConfig);
    
    if (!receiptResult.success) {
      return res.status(500).json(receiptResult);
    }
    
    // 2. 打印标签（如果有商品）
    if (order.items && order.items.length > 0) {
      const labelsResult = await printLabels(order, order.items, printerType, printerConfig);
      
      if (!labelsResult.success) {
        return res.status(500).json(labelsResult);
      }
    }
    
    res.json({
      success: true,
      message: '订单打印完成'
    });
  } catch (error) {
    console.error('打印订单失败:', error);
    res.status(500).json({
      success: false,
      message: '打印订单失败',
      error: error.message
    });
  }
});

/**
 * 获取USB打印机
 */
function getUSBPrinter(config = {}) {
  const vid = config.vid || PRINTER_CONFIG.usb.vid;
  const pid = config.pid || PRINTER_CONFIG.usb.pid;
  
  try {
    const device = new USB(vid, pid);
    const printer = new escpos.Printer(device);
    return { device, printer };
  } catch (error) {
    console.error('获取USB打印机失败:', error);
    throw error;
  }
}

/**
 * 获取网络打印机
 */
function getNetworkPrinter(config = {}) {
  const host = config.host || PRINTER_CONFIG.network.host;
  const port = config.port || PRINTER_CONFIG.network.port;
  
  try {
    const device = new Network(host, port);
    const printer = new escpos.Printer(device);
    return { device, printer };
  } catch (error) {
    console.error('获取网络打印机失败:', error);
    throw error;
  }
}

/**
 * 打印小票
 */
async function printReceipt(order, printerType = 'usb', printerConfig = {}) {
  return new Promise((resolve, reject) => {
    try {
      let device, printer;
      
      if (printerType === 'usb') {
        ({ device, printer } = getUSBPrinter(printerConfig));
      } else {
        ({ device, printer } = getNetworkPrinter(printerConfig));
      }

      device.open(async (error) => {
        if (error) {
          console.error('打开打印机失败:', error);
          resolve({
            success: false,
            message: '打开打印机失败: ' + error.message
          });
          return;
        }

        try {
          const timeStr = new Date(order.created_at || order.createdAt).toLocaleString('zh-CN');
          const productTotal = parseFloat(order.product_total || order.productTotal || 0);
          const deliveryFee = parseFloat(order.delivery_fee || order.deliveryFee || 0);
          const memberDiscount = parseFloat(order.member_discount || order.memberDiscount || 0);
          const couponDiscount = parseFloat(order.discount || order.coupon_discount || 0);
          const finalPrice = parseFloat(order.final_price || order.finalPrice || 0);

          // 开始打印
          printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(2, 2)
            .text('半夏奶茶店')
            .size(1, 1)
            .text('')
            .align('lt')
            .text(`订单号: ${order.order_no}`)
            .text(`下单时间: ${timeStr}`)
            .text(`支付方式: ${getPaymentMethodText(order.payment_method)}`)
            .text(`联系电话: ${order.phone || '-'}`)
            .text('--------------------------------')
            .text('商品明细:')
            .text('');

          // 打印商品列表
          if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
              const name = item.product_name || item.name || '未知商品';
              const qty = item.quantity || 1;
              const price = parseFloat(item.price) || 0;
              const itemTotal = price * qty;
              const spec = item.spec ? `(${item.spec})` : '';
              
              printer.text(`${name}${spec}`);
              printer.text(`  ${qty} x ¥${price.toFixed(2)} = ¥${itemTotal.toFixed(2)}`);
            });
          }

          printer
            .text('')
            .text('--------------------------------')
            .text(`商品金额: ¥${productTotal.toFixed(2)}`);

          if (deliveryFee > 0) {
            printer.text(`配送费: ¥${deliveryFee.toFixed(2)}`);
          }

          if (memberDiscount > 0) {
            printer.text(`会员折扣: -¥${memberDiscount.toFixed(2)}`);
          }

          if (couponDiscount > 0) {
            printer.text(`优惠券: -¥${couponDiscount.toFixed(2)}`);
          }

          printer
            .text('--------------------------------')
            .size(2, 1)
            .text(`合计: ¥${finalPrice.toFixed(2)}`)
            .size(1, 1)
            .text('')
            .align('ct')
            .text('感谢您的惠顾，欢迎下次光临！');

          if (order.is_pickup) {
            printer.text('【自取订单】请保留小票，凭小票取餐');
          }

          printer
            .text('')
            .cut()
            .close(() => {
              console.log('小票打印完成');
              resolve({
                success: true,
                message: '小票打印成功'
              });
            });
        } catch (printError) {
          console.error('打印过程出错:', printError);
          resolve({
            success: false,
            message: '打印过程出错: ' + printError.message
          });
        }
      });
    } catch (error) {
      console.error('打印小票失败:', error);
      resolve({
        success: false,
        message: '打印小票失败: ' + error.message
      });
    }
  });
}

/**
 * 打印标签
 */
async function printLabels(order, items, printerType = 'usb', printerConfig = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      let device, printer;
      
      if (printerType === 'usb') {
        ({ device, printer } = getUSBPrinter(printerConfig));
      } else {
        ({ device, printer } = getNetworkPrinter(printerConfig));
      }

      const totalLabels = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      let currentLabel = 1;
      let hasError = false;

      for (const item of items) {
        const quantity = item.quantity || 1;
        
        for (let i = 0; i < quantity; i++) {
          await new Promise((labelResolve, labelReject) => {
            device.open((error) => {
              if (error) {
                console.error('打开打印机失败:', error);
                hasError = true;
                labelResolve();
                return;
              }

              try {
                const orderTime = new Date(order.created_at || order.createdAt);
                const timeStr = `${orderTime.getFullYear()}-${orderTime.getMonth() + 1}-${orderTime.getDate()}-${String(orderTime.getHours()).padStart(2, '0')}:${String(orderTime.getMinutes()).padStart(2, '0')}:${String(orderTime.getSeconds()).padStart(2, '0')}`;
                
                const orderTypeText = {
                  'self': '堂食',
                  'pickup': '自取',
                  'delivery': '外卖'
                }[order.order_type] || '堂食';

                // 解析配料
                let toppingsText = '';
                if (item.toppings) {
                  try {
                    const toppings = typeof item.toppings === 'string' ? JSON.parse(item.toppings) : item.toppings;
                    if (Array.isArray(toppings) && toppings.length > 0) {
                      toppingsText = toppings.map(t => `加${typeof t === 'object' ? t.name : t}`).join('|');
                    }
                  } catch (e) {
                    console.error('解析配料失败:', e);
                  }
                }

                const specs = [];
                if (item.sugar) specs.push(item.sugar);
                if (item.ice) specs.push(item.ice);
                if (toppingsText) specs.push(toppingsText);

                const productDisplay = item.spec
                  ? `${item.product_name}(${item.spec})`
                  : item.product_name;

                // 打印标签内容
                printer
                  .font('a')
                  .align('lt')
                  .size(1, 1)
                  .text(`${orderTypeText} [${currentLabel}/${totalLabels}]`)
                  .text(`订单号:${order.order_no}`)
                  .size(1, 2)
                  .text(productDisplay)
                  .size(1, 1);

                if (specs.length > 0) {
                  printer.text(specs.join(' | '));
                }

                printer
                  .text(timeStr)
                  .cut()
                  .close(() => {
                    console.log(`标签 ${currentLabel}/${totalLabels} 打印完成`);
                    currentLabel++;
                    labelResolve();
                  });
              } catch (printError) {
                console.error('打印标签出错:', printError);
                hasError = true;
                labelResolve();
              }
            });
          });
        }
      }

      if (hasError) {
        resolve({
          success: false,
          message: '部分标签打印失败'
        });
      } else {
        resolve({
          success: true,
          message: '所有标签打印完成'
        });
      }
    } catch (error) {
      console.error('打印标签失败:', error);
      resolve({
        success: false,
        message: '打印标签失败: ' + error.message
      });
    }
  });
}

/**
 * 获取支付方式文本
 */
function getPaymentMethodText(method) {
  const methods = {
    'wechat': '微信支付',
    'alipay': '支付宝',
    'cash': '现金',
    'wallet': '储值支付',
    'card': '银行卡'
  };
  return methods[method] || method || '未知';
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`本地打印服务已启动`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`=================================`);
  console.log(`可用接口:`);
  console.log(`  GET  /health        - 健康检查`);
  console.log(`  GET  /printers      - 获取打印机列表`);
  console.log(`  POST /print/receipt - 打印小票`);
  console.log(`  POST /print/labels  - 打印标签`);
  console.log(`  POST /print/order   - 打印订单（小票+标签）`);
  console.log(`=================================`);
});
