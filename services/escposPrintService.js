const escpos = require('escpos');
const USB = require('escpos-usb');
const Network = require('escpos-network');

// 打印机配置
const PRINTER_CONFIG = {
  // USB打印机配置（美团智能商用终端通常使用USB连接）
  usb: {
    vid: 0x0483,  // 默认USB VID，可能需要根据实际打印机调整
    pid: 0x5743,  // 默认USB PID，可能需要根据实际打印机调整
  },
  // 网络打印机配置
  network: {
    host: '192.168.1.100',  // 打印机IP地址
    port: 9100,             // 默认打印机端口
  }
};

/**
 * 获取USB打印机设备
 */
function getUSBPrinter() {
  try {
    const device = new USB(PRINTER_CONFIG.usb.vid, PRINTER_CONFIG.usb.pid);
    const printer = new escpos.Printer(device);
    return { device, printer };
  } catch (error) {
    console.error('获取USB打印机失败:', error);
    throw error;
  }
}

/**
 * 获取网络打印机设备
 */
function getNetworkPrinter() {
  try {
    const device = new Network(PRINTER_CONFIG.network.host, PRINTER_CONFIG.network.port);
    const printer = new escpos.Printer(device);
    return { device, printer };
  } catch (error) {
    console.error('获取网络打印机失败:', error);
    throw error;
  }
}

/**
 * 打印小票（58mm热敏纸）
 * @param {Object} order - 订单数据
 * @param {string} printerType - 打印机类型: 'usb' | 'network'
 */
async function printReceipt(order, printerType = 'usb') {
  return new Promise((resolve, reject) => {
    try {
      let device, printer;
      
      if (printerType === 'usb') {
        ({ device, printer } = getUSBPrinter());
      } else {
        ({ device, printer } = getNetworkPrinter());
      }

      device.open((error) => {
        if (error) {
          console.error('打开打印机失败:', error);
          reject(error);
          return;
        }

        const timeStr = new Date(order.created_at).toLocaleString('zh-CN');
        const productTotal = parseFloat(order.product_total) || 0;
        const deliveryFee = parseFloat(order.delivery_fee) || 0;
        const memberDiscount = parseFloat(order.member_discount) || 0;
        const couponDiscount = parseFloat(order.coupon_discount) || 0;
        const total = parseFloat(order.total) || 0;

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
            
            // 商品名称（左对齐，最多16个字符）
            const nameStr = name.length > 16 ? name.substring(0, 16) : name;
            printer.text(`${nameStr}`);
            
            // 数量和价格（右对齐）
            const qtyPriceStr = `  x${qty}  ¥${itemTotal.toFixed(2)}`;
            printer.align('rt').text(qtyPriceStr).align('lt');
            
            // 打印规格（如果有）
            if (item.specs) {
              printer.text(`  ${item.specs}`);
            }
          });
        }

        printer
          .text('')
          .text('--------------------------------')
          .text(`商品金额: ¥${productTotal.toFixed(2)}`)
          .text(`配送费: ¥${deliveryFee.toFixed(2)}`);

        if (memberDiscount > 0) {
          printer.text(`会员折扣: -¥${memberDiscount.toFixed(2)}`);
        }

        if (couponDiscount > 0) {
          printer.text(`优惠券: -¥${couponDiscount.toFixed(2)}`);
        }

        printer
          .text('--------------------------------')
          .size(2, 1)
          .text(`合计: ¥${total.toFixed(2)}`)
          .size(1, 1)
          .text('')
          .align('ct')
          .text('谢谢惠顾，欢迎下次光临！')
          .text('')
          .text('')
          .cut()  // 切纸
          .close(() => {
            console.log('小票打印完成');
            resolve();
          });
      });
    } catch (error) {
      console.error('打印小票失败:', error);
      reject(error);
    }
  });
}

/**
 * 打印标签（40x30mm或50x30mm标签纸）
 * @param {Object} order - 订单数据
 * @param {Object} item - 商品项
 * @param {number} index - 当前标签序号
 * @param {number} total - 总标签数
 * @param {string} printerType - 打印机类型: 'usb' | 'network'
 */
async function printLabel(order, item, index, total, printerType = 'usb') {
  return new Promise((resolve, reject) => {
    try {
      let device, printer;
      
      if (printerType === 'usb') {
        ({ device, printer } = getUSBPrinter());
      } else {
        ({ device, printer } = getNetworkPrinter());
      }

      device.open((error) => {
        if (error) {
          console.error('打开打印机失败:', error);
          reject(error);
          return;
        }

        const productName = item.product_name || item.name || '未知商品';
        const specs = item.specs || '';
        const sugar = item.sugar || '';
        const ice = item.ice || '';
        const toppings = item.toppings || [];
        const quantity = item.quantity || 1;

        // 标签内容
        printer
          .font('a')
          .align('ct')
          .size(2, 2)
          .text(productName)
          .size(1, 1)
          .text('')
          .align('lt');

        // 规格信息
        if (specs) {
          printer.text(`规格: ${specs}`);
        }
        if (sugar) {
          printer.text(`糖度: ${sugar}`);
        }
        if (ice) {
          printer.text(`冰度: ${ice}`);
        }
        if (toppings.length > 0) {
          printer.text(`加料: ${toppings.join(', ')}`);
        }

        printer
          .text('')
          .align('ct')
          .text(`[${index}/${total}]`)
          .text(`数量: ${quantity}`)
          .text('')
          .barcode(order.order_no.substring(order.order_no.length - 6), 'CODE39')  // 条形码
          .text('')
          .cut()  // 切纸
          .close(() => {
            console.log(`标签 [${index}/${total}] 打印完成`);
            resolve();
          });
      });
    } catch (error) {
      console.error('打印标签失败:', error);
      reject(error);
    }
  });
}

/**
 * 打印订单（小票+标签）
 * @param {Object} order - 订单数据
 * @param {string} printerType - 打印机类型: 'usb' | 'network'
 */
async function printOrder(order, printerType = 'usb') {
  try {
    // 1. 打印小票
    await printReceipt(order, printerType);
    
    // 2. 打印标签（如果有商品）
    if (order.items && order.items.length > 0) {
      const totalLabels = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      let currentLabel = 1;
      
      for (const item of order.items) {
        const quantity = item.quantity || 1;
        for (let i = 0; i < quantity; i++) {
          await printLabel(order, item, currentLabel, totalLabels, printerType);
          currentLabel++;
        }
      }
    }
    
    console.log('订单打印完成');
    return { success: true, message: '打印成功' };
  } catch (error) {
    console.error('打印订单失败:', error);
    return { success: false, message: error.message };
  }
}

/**
 * 获取支付方式文本
 */
function getPaymentMethodText(method) {
  const methodMap = {
    'wechat': '微信支付',
    'alipay': '支付宝',
    'wallet': '储值支付',
    'cash': '现金',
    'card': '刷卡'
  };
  return methodMap[method] || method || '未知';
}

/**
 * 测试打印机连接
 * @param {string} printerType - 打印机类型: 'usb' | 'network'
 */
async function testPrinter(printerType = 'usb') {
  return new Promise((resolve, reject) => {
    try {
      let device, printer;
      
      if (printerType === 'usb') {
        ({ device, printer } = getUSBPrinter());
      } else {
        ({ device, printer } = getNetworkPrinter());
      }

      device.open((error) => {
        if (error) {
          console.error('打印机连接测试失败:', error);
          reject({ success: false, message: '打印机连接失败', error: error.message });
          return;
        }

        printer
          .font('a')
          .align('ct')
          .text('打印机测试页')
          .text('')
          .text('如果看到此内容，说明打印机连接正常！')
          .text('')
          .cut()
          .close(() => {
            console.log('打印机测试完成');
            resolve({ success: true, message: '打印机连接正常' });
          });
      });
    } catch (error) {
      console.error('打印机测试失败:', error);
      reject({ success: false, message: error.message });
    }
  });
}

module.exports = {
  printReceipt,
  printLabel,
  printOrder,
  testPrinter,
  PRINTER_CONFIG
};
