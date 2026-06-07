const { DeliveryPlatform, Order, Store } = require('./models');
const { sendOrderToPlatform } = require('./services/foodDeliveryService');

async function checkAndConfig() {
  try {
    console.log('========== 检查配送平台配置 ==========\n');
    
    // 1. 检查配送平台配置
    console.log('1. 检查配送平台配置...');
    let platform = await DeliveryPlatform.findOne({ where: { code: 'waimai' } });
    
    if (!platform) {
      console.log('   配送平台不存在，创建新配置...');
      platform = await DeliveryPlatform.create({
        name: '半夏配送',
        code: 'waimai',
        platform_type: 'food_delivery',
        api_url: 'http://localhost:5173',
        app_key: 'mk_a9f07d0d93333cdb384aa0bd0412b397',
        app_secret: 'ms_f0d913d402a0e5c064e902997772820deb088ab3d17bb44eca9e0f158e12602e',
        callback_url: 'http://localhost:8080/api/delivery/callback',
        is_active: true
      });
      console.log('   ✅ 创建成功!\n');
    } else {
      console.log('   配送平台已存在，更新配置...');
      await platform.update({
        api_url: 'http://localhost:5173',
        app_key: 'mk_a9f07d0d93333cdb384aa0bd0412b397',
        app_secret: 'ms_f0d913d402a0e5c064e902997772820deb088ab3d17bb44eca9e0f158e12602e',
        callback_url: 'http://localhost:8080/api/delivery/callback',
        is_active: true
      });
      console.log('   ✅ 更新成功!\n');
    }
    
    console.log('   平台配置:', {
      name: platform.name,
      code: platform.code,
      api_url: platform.api_url,
      app_key: platform.app_key,
      is_active: platform.is_active
    });
    
    // 2. 检查最近的订单
    console.log('\n2. 检查最近的订单...');
    const orders = await Order.findAll({
      where: { order_type: 'delivery' },
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    console.log(`   找到 ${orders.length} 个外卖订单`);
    orders.forEach(order => {
      console.log(`   - 订单号: ${order.order_no}, 状态: ${order.status}, platform_code: ${order.platform_code || '未设置'}`);
    });
    
    // 3. 如果有订单，测试发送
    if (orders.length > 0) {
      const testOrder = orders[0];
      console.log(`\n3. 测试发送订单 ${testOrder.order_no} 到配送平台...`);
      
      // 确保订单有 platform_code
      if (!testOrder.platform_code) {
        await testOrder.update({ platform_code: 'waimai' });
        console.log('   已设置 platform_code 为 waimai');
      }
      
      const result = await sendOrderToPlatform(testOrder, 'waimai');
      console.log('   发送结果:', result);
    }
    
    console.log('\n========== 检查完成 ==========');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkAndConfig();