/**
 * 网络打印模块
 * 直接通过网络发送 ESC/POS 指令到打印机
 */

const net = require('net');
const moment = require('moment');

class NetworkPrinter {
  constructor(config = {}) {
    this.host = config.host || '192.168.1.100';
    this.port = config.port || 9100;
    this.timeout = config.timeout || 5000;
    this.width = config.width || 48;
  }

  /**
   * 连接打印机
   */
  connect() {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      
      socket.setTimeout(this.timeout);
      
      socket.connect(this.port, this.host, () => {
        console.log(`✓ 打印机已连接: ${this.host}:${this.port}`);
        resolve(socket);
      });
      
      socket.on('error', (err) => {
        console.error(`✗ 打印机连接失败: ${err.message}`);
        reject(err);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('连接打印机超时'));
      });
    });
  }

  /**
   * 发送数据到打印机
   */
  async send(buffer) {
    let socket;
    try {
      socket = await this.connect();
      return new Promise((resolve, reject) => {
        socket.write(buffer, (err) => {
          if (err) {
            reject(err);
          } else {
            socket.end();
            resolve();
          }
        });
        
        socket.on('error', reject);
      });
    } catch (error) {
      if (socket) socket.destroy();
      throw error;
    }
  }

  /**
   * 打印文本
   */
  async printText(text, options = {}) {
    const align = options.align || 'lt';
    const font = options.font || 'a';
    const size = options.size || { width: 1, height: 1 };
    const bold = options.bold || false;
    
    const commands = [];
    
    // 对齐
    if (align === 'ct') commands.push(0x1B, 0x61, 0x01);
    else if (align === 'rt') commands.push(0x1B, 0x61, 0x02);
    else commands.push(0x1B, 0x61, 0x00);
    
    // 字体
    if (font === 'b') commands.push(0x1B, 0x4D, 0x01);
    else commands.push(0x1B, 0x4D, 0x00);
    
    // 字体大小
    commands.push(0x1D, 0x21, ((size.width & 0x0F) << 4) | (size.height & 0x0F));
    
    // 粗体
    if (bold) commands.push(0x1B, 0x45, 0x01);
    else commands.push(0x1B, 0x45, 0x00);
    
    // 文本内容
    if (text) {
      commands.push(...Buffer.from(text + '\n', 'gbk'));
    }
    
    await this.send(Buffer.from(commands));
  }

  /**
   * 打印分隔线
   */
  async printLine(char = '-') {
    const line = char.repeat(this.width);
    await this.printText(line);
  }

  /**
   * 切纸
   */
  async cut() {
    const commands = [
      0x1D, 0x56, 0x42, 0x00
    ];
    await this.send(Buffer.from(commands));
  }

  /**
   * 打印小票
   */
  async printReceipt(data) {
    const {
      storeName = '奶茶店',
      orderNo,
      createTime,
      items = [],
      subtotal = 0,
      discount = 0,
      total = 0,
      payType = '未知',
      payTime,
      qrCode
    } = data;
    
    try {
      // 店铺名称（居中，大字）
      await this.printText(storeName, { align: 'ct', size: { width: 2, height: 2 } });
      await this.printText('');
      
      // 订单信息（左对齐）
      await this.printText(`订单号: ${orderNo}`, { align: 'lt', size: { width: 1, height: 1 } });
      await this.printText(`时间: ${moment(createTime).format('YYYY-MM-DD HH:mm:ss')}`, { align: 'lt' });
      await this.printLine();
      
      // 表头
      await this.printText('商品名称        数量    金额', { align: 'lt' });
      await this.printLine();
      
      // 商品列表
      for (const item of items) {
        const name = item.name ? item.name.substring(0, 12).padEnd(12) : '';
        const qty = String(item.quantity || 0).padStart(4);
        const price = `¥${(item.price || 0).toFixed(2)}`.padStart(8);
        await this.printText(`${name}${qty}${price}`, { align: 'lt' });
        
        if (item.specs && item.specs.length > 0) {
          await this.printText(`  ${item.specs.join(', ')}`, { align: 'lt' });
        }
      }
      
      await this.printLine();
      
      // 金额信息（右对齐）
      await this.printText(`小计: ¥${subtotal.toFixed(2)}`, { align: 'rt' });
      if (discount > 0) {
        await this.printText(`优惠: -¥${discount.toFixed(2)}`, { align: 'rt' });
      }
      await this.printText(`实付: ¥${total.toFixed(2)}`, { align: 'rt', size: { width: 2, height: 2 } });
      
      await this.printLine();
      
      // 支付信息
      await this.printText(`支付方式: ${payType}`, { align: 'lt' });
      if (payTime) {
        await this.printText(`支付时间: ${moment(payTime).format('HH:mm:ss')}`, { align: 'lt' });
      }
      
      await this.printText('');
      
      // 结束语
      await this.printText('谢谢惠顾，欢迎下次光临！', { align: 'ct' });
      await this.printText('');
      await this.printText('');
      await this.printText('');
      
      // 切纸
      await this.cut();
      
      console.log('✓ 打印成功');
      return { success: true, message: '打印成功' };
      
    } catch (error) {
      console.error('✗ 打印失败:', error);
      throw error;
    }
  }

  /**
   * 打印测试页
   */
  async printTest() {
    const testData = {
      storeName: '奶茶店测试',
      orderNo: 'TEST' + Date.now(),
      createTime: new Date(),
      items: [
        { name: '珍珠奶茶', quantity: 2, price: 15.00, specs: ['大杯', '少冰', '七分糖'] },
        { name: '芝士奶盖', quantity: 1, price: 18.00, specs: ['中杯', '正常冰'] }
      ],
      subtotal: 48.00,
      discount: 5.00,
      total: 43.00,
      payType: '微信支付',
      payTime: new Date()
    };
    
    return await this.printReceipt(testData);
  }
}

module.exports = NetworkPrinter;
