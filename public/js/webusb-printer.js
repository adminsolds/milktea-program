/**
 * WebUSB 打印机控制库
 * 用于安卓系统美团点餐机通过浏览器直接控制 USB 打印机
 * 
 * 支持：
 * - ESC/POS 指令集
 * - USB 热敏打印机
 * - Chrome 61+ (Android)
 */

class WebUSBPrinter {
  constructor() {
    this.device = null;
    this.endpoint = null;
    this.isConnected = false;
    this.encoder = new TextEncoder();
  }

  /**
   * 检查浏览器是否支持 WebUSB
   */
  static isSupported() {
    return 'usb' in navigator;
  }

  /**
   * 请求连接打印机
   */
  async requestDevice() {
    try {
      // 请求用户选择 USB 设备
      const device = await navigator.usb.requestDevice({
        filters: [
          // 常见热敏打印机的 Vendor ID
          { vendorId: 0x0483 }, // STMicroelectronics
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x067b }, // Prolific
          { vendorId: 0x0456 }, // Silicon Labs
          { vendorId: 0x1a86 }, // QinHeng
          { vendorId: 0x0451 }, // Texas Instruments
          // 美团打印机可能的 VID
          { vendorId: 0x1234 },
        ]
      });

      this.device = device;
      console.log('选择的打印机:', device.productName, 'VID:', device.vendorId, 'PID:', device.productId);
      
      return {
        success: true,
        device: {
          name: device.productName,
          vendorId: device.vendorId,
          productId: device.productId,
          serialNumber: device.serialNumber
        }
      };
    } catch (error) {
      console.error('选择打印机失败:', error);
      return {
        success: false,
        message: error.message || '用户取消选择'
      };
    }
  }

  /**
   * 连接打印机
   */
  async connect() {
    if (!this.device) {
      return { success: false, message: '请先选择打印机' };
    }

    try {
      // 打开设备
      await this.device.open();
      
      // 选择配置（通常是配置 1）
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }
      
      // 查找接口和端点
      const configuration = this.device.configuration;
      let interfaceNumber = null;
      let endpointNumber = null;
      
      // 查找批量输出端点
      for (const iface of configuration.interfaces) {
        for (const endpoint of iface.alternate.endpoints) {
          if (endpoint.direction === 'out' && endpoint.type === 'bulk') {
            interfaceNumber = iface.interfaceNumber;
            endpointNumber = endpoint.endpointNumber;
            break;
          }
        }
        if (interfaceNumber !== null) break;
      }
      
      if (interfaceNumber === null) {
        throw new Error('未找到可用的打印端点');
      }
      
      // 声明接口
      await this.device.claimInterface(interfaceNumber);
      
      this.endpoint = { interfaceNumber, endpointNumber };
      this.isConnected = true;
      
      console.log('打印机连接成功:', this.endpoint);
      
      return { success: true, message: '打印机连接成功' };
    } catch (error) {
      console.error('连接打印机失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 断开打印机
   */
  async disconnect() {
    if (this.device) {
      try {
        await this.device.close();
        this.isConnected = false;
        this.endpoint = null;
        console.log('打印机已断开');
        return { success: true, message: '打印机已断开' };
      } catch (error) {
        console.error('断开打印机失败:', error);
        return { success: false, message: error.message };
      }
    }
    return { success: true, message: '打印机未连接' };
  }

  /**
   * 发送原始数据到打印机
   */
  async sendRaw(data) {
    if (!this.isConnected || !this.endpoint) {
      return { success: false, message: '打印机未连接' };
    }

    try {
      let uint8Array;
      
      if (typeof data === 'string') {
        uint8Array = this.encoder.encode(data);
      } else if (data instanceof Uint8Array) {
        uint8Array = data;
      } else if (Array.isArray(data)) {
        uint8Array = new Uint8Array(data);
      } else {
        return { success: false, message: '不支持的数据类型' };
      }
      
      // 分批发送数据（每批 64KB）
      const chunkSize = 64 * 1024;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        await this.device.transferOut(this.endpoint.endpointNumber, chunk);
      }
      
      return { success: true };
    } catch (error) {
      console.error('发送数据失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 发送 ESC/POS 指令
   */
  async sendCommand(command) {
    return await this.sendRaw(command);
  }

  // ==================== ESC/POS 指令 ====================

  /**
   * 初始化打印机
   */
  async initialize() {
    return await this.sendCommand(new Uint8Array([0x1B, 0x40])); // ESC @
  }

  /**
   * 换行
   */
  async lineFeed(lines = 1) {
    for (let i = 0; i < lines; i++) {
      await this.sendCommand(new Uint8Array([0x0A])); // LF
    }
  }

  /**
   * 设置对齐方式
   * @param {number} align - 0:左对齐, 1:居中, 2:右对齐
   */
  async setAlignment(align) {
    return await this.sendCommand(new Uint8Array([0x1B, 0x61, align]));
  }

  /**
   * 设置字体大小
   * @param {number} width - 宽度倍数 (1-8)
   * @param {number} height - 高度倍数 (1-8)
   */
  async setFontSize(width, height) {
    const size = ((width - 1) << 4) | (height - 1);
    return await this.sendCommand(new Uint8Array([0x1D, 0x21, size]));
  }

  /**
   * 恢复默认字体大小
   */
  async resetFontSize() {
    return await this.sendCommand(new Uint8Array([0x1D, 0x21, 0x00]));
  }

  /**
   * 设置加粗
   * @param {boolean} bold
   */
  async setBold(bold) {
    return await this.sendCommand(new Uint8Array([0x1B, 0x45, bold ? 0x01 : 0x00]));
  }

  /**
   * 打印文本
   */
  async printText(text) {
    // 将文本转换为 GBK 编码（中文支持）
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(text);
    return await this.sendRaw(uint8Array);
  }

  /**
   * 打印并换行
   */
  async printLine(text) {
    await this.printText(text);
    await this.lineFeed();
  }

  /**
   * 打印水平分割线
   */
  async printDivider(char = '-', length = 32) {
    const line = char.repeat(length);
    await this.printLine(line);
  }

  /**
   * 切纸
   */
  async cut() {
    // 先走纸到切纸位置
    await this.lineFeed(5);
    // 执行切纸
    return await this.sendCommand(new Uint8Array([0x1D, 0x56, 0x01]));
  }

  /**
   * 打开钱箱
   */
  async openCashDrawer() {
    return await this.sendCommand(new Uint8Array([0x1B, 0x70, 0x00, 0x32, 0x32]));
  }

  // ==================== 高级打印功能 ====================

  /**
   * 打印小票
   * @param {Object} order - 订单数据
   */
  async printReceipt(order) {
    try {
      // 初始化打印机
      await this.initialize();
      
      // 打印标题
      await this.setAlignment(1); // 居中
      await this.setFontSize(2, 2);
      await this.setBold(true);
      await this.printLine('半夏奶茶店');
      await this.resetFontSize();
      await this.setBold(false);
      await this.lineFeed();
      
      // 打印订单信息
      await this.setAlignment(0); // 左对齐
      const timeStr = new Date(order.created_at || order.createdAt).toLocaleString('zh-CN');
      await this.printLine(`订单号: ${order.order_no}`);
      await this.printLine(`下单时间: ${timeStr}`);
      await this.printLine(`支付方式: ${this.getPaymentMethodText(order.payment_method)}`);
      await this.printLine(`联系电话: ${order.phone || '-'}`);
      await this.printDivider();
      
      // 打印商品列表
      await this.printLine('商品明细:');
      await this.lineFeed();
      
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const name = item.product_name || item.name || '未知商品';
          const qty = item.quantity || 1;
          const price = parseFloat(item.price) || 0;
          const itemTotal = price * qty;
          const spec = item.spec ? `(${item.spec})` : '';
          
          await this.printLine(`${name}${spec}`);
          await this.printLine(`  ${qty} x ¥${price.toFixed(2)} = ¥${itemTotal.toFixed(2)}`);
        }
      }
      
      await this.lineFeed();
      await this.printDivider();
      
      // 打印金额信息
      const productTotal = parseFloat(order.product_total || order.productTotal || 0);
      const memberDiscount = parseFloat(order.member_discount || order.memberDiscount || 0);
      const couponDiscount = parseFloat(order.discount || order.coupon_discount || 0);
      const finalPrice = parseFloat(order.final_price || order.finalPrice || 0);
      
      await this.printLine(`商品金额: ¥${productTotal.toFixed(2)}`);
      
      if (memberDiscount > 0) {
        await this.printLine(`会员折扣: -¥${memberDiscount.toFixed(2)}`);
      }
      
      if (couponDiscount > 0) {
        await this.printLine(`优惠券: -¥${couponDiscount.toFixed(2)}`);
      }
      
      await this.printDivider();
      
      // 打印合计
      await this.setFontSize(2, 1);
      await this.setBold(true);
      await this.printLine(`合计: ¥${finalPrice.toFixed(2)}`);
      await this.resetFontSize();
      await this.setBold(false);
      
      await this.lineFeed();
      
      // 打印页脚
      await this.setAlignment(1);
      await this.printLine('感谢您的惠顾，欢迎下次光临！');
      
      if (order.is_pickup) {
        await this.printLine('【自取订单】请保留小票，凭小票取餐');
      }
      
      // 切纸
      await this.cut();
      
      return { success: true, message: '小票打印成功' };
    } catch (error) {
      console.error('打印小票失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 打印标签
   * @param {Object} order - 订单数据
   * @param {Object} item - 商品数据
   * @param {number} currentIndex - 当前标签序号
   * @param {number} totalCount - 总标签数
   */
  async printLabel(order, item, currentIndex = 1, totalCount = 1) {
    try {
      await this.initialize();
      
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
      await this.setAlignment(0);
      await this.printLine(`${orderTypeText} [${currentIndex}/${totalCount}]`);
      await this.printLine(`订单号:${order.order_no}`);
      await this.setFontSize(1, 2);
      await this.printLine(productDisplay);
      await this.resetFontSize();
      
      if (specs.length > 0) {
        await this.printLine(specs.join(' | '));
      }
      
      await this.printLine(timeStr);
      
      // 切纸
      await this.cut();
      
      return { success: true, message: '标签打印成功' };
    } catch (error) {
      console.error('打印标签失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 打印订单（小票+标签）
   * @param {Object} order - 订单数据
   */
  async printOrder(order) {
    try {
      // 1. 打印小票
      const receiptResult = await this.printReceipt(order);
      if (!receiptResult.success) {
        return receiptResult;
      }

      // 2. 打印标签
      if (order.items && order.items.length > 0) {
        const totalLabels = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        let currentLabel = 1;

        for (const item of order.items) {
          const quantity = item.quantity || 1;
          for (let i = 0; i < quantity; i++) {
            const labelResult = await this.printLabel(order, item, currentLabel, totalLabels);
            if (!labelResult.success) {
              return labelResult;
            }
            currentLabel++;
          }
        }
      }

      return { success: true, message: '订单打印完成' };
    } catch (error) {
      console.error('打印订单失败:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 获取支付方式文本
   */
  getPaymentMethodText(method) {
    const methods = {
      'wechat': '微信支付',
      'alipay': '支付宝',
      'cash': '现金',
      'wallet': '储值支付',
      'card': '银行卡'
    };
    return methods[method] || method || '未知';
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebUSBPrinter;
}
