const { sendOrderToPlatform } = require('./services/foodDeliveryService');
const { Order } = require('./models');

async function testSendOrder() {
  try {
    console.log('========== 测试发送订单到半夏配送 ==========\n');
    
    // 查找订单
    const orderNo = 'MX1771336369469';
    console.log('1. 查找订单:', orderNo);
    const order = await Order.findOne({ where: { order_no: orderNo } });
    
    if (!order) {
      console.log('❌ 订单不存在！');
      return;
    }
    
    console.log('   找到订单:');
    console.log('   - 订单号:', order.order_no);
    console.log('   - 状态:', order.status);
    console.log('   - 类型:', order.order_type);
    console.log('   - platform_code:', order.platform_code);
    console.log('   - 收货人:', order.receiver_name);
    console.log('   - 金额:', order.final_price);
    
    // 发送订单
    console.log('\n2. 发送订单到配送平台...');
    const result = await sendOrderToPlatform(order, 'banxia');
    
    console.log('\n3. 发送结果:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n========== 测试完成 ==========');
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testSendOrder();