/**
 * 测试订单创建后自动发送配送功能
 */

const { Order, OrderItem, User, Store, DeliveryPlatform } = require('../models');
const { sendOrderToPlatform } = require('../services/foodDeliveryService');

async function testAutoDelivery() {
  try {
    console.log('========================================');
    console.log('   测试自动发送配送功能');
    console.log('========================================\n');

    // 1. 检查平台配置
    console.log('1. 检查配送平台配置...');
    const platform = await DeliveryPlatform.findOne({
      where: { code: 'banxia', is_active: true }
    });

    if (!platform) {
      console.error('❌ 未找到 banxia 平台配置');
      return;
    }

    console.log('✅ 平台配置:');
    console.log('   代码:', platform.code);
    console.log('   名称:', platform.name);
    console.log('   API地址:', platform.api_url);
    console.log('   App Key:', platform.app_key);
    console.log('   App Secret:', platform.app_secret);
    console.log('');

    // 2. 获取测试用户
    console.log('2. 获取测试用户...');
    const user = await User.findOne();
    if (!user) {
      console.error('❌ 未找到用户');
      return;
    }
    console.log('✅ 测试用户:', user.nickname || user.id);
    console.log('');

    // 3. 获取测试门店
    console.log('3. 获取测试门店...');
    const store = await Store.findOne();
    if (!store) {
      console.error('❌ 未找到门店');
      return;
    }
    console.log('✅ 测试门店:', store.name);
    console.log('   地址:', store.address);
    console.log('');

    // 4. 创建测试订单
    console.log('4. 创建测试外卖订单...');
    const orderNo = 'MX' + Date.now();
    const order = await Order.create({
      order_no: orderNo,
      user_id: user.id,
      store_id: store.id,
      product_total: 58.00,
      delivery_fee: 5.00,
      discount: 0,
      member_discount: 0,
      final_price: 63.00,
      payment_method: 'wechat',
      status: 1, // 已下单
      order_type: 'delivery', // 外卖订单
      platform_code: 'banxia',
      receiver_name: '测试顾客',
      receiver_phone: '13800138000',
      receiver_address: '北京市朝阳区三里屯SOHO A座1201',
      receiver_lat: 39.918692,
      receiver_lng: 116.407477,
      remark: '请尽快送达，谢谢！'
    });

    console.log('✅ 订单创建成功:', order.order_no);
    console.log('   订单ID:', order.id);
    console.log('   订单类型:', order.order_type);
    console.log('');

    // 5. 创建订单商品
    console.log('5. 创建订单商品...');
    const orderItems = await OrderItem.bulkCreate([
      {
        order_id: order.id,
        product_id: 1,
        product_name: '招牌奶茶(大杯/少冰/七分糖)',
        price: 18.00,
        quantity: 2,
        spec: '大杯/少冰/七分糖',
        sugar: '七分糖',
        toppings: JSON.stringify([])
      },
      {
        order_id: order.id,
        product_id: 2,
        product_name: '芝士奶盖茶(中杯/去冰/五分糖)',
        price: 22.00,
        quantity: 1,
        spec: '中杯/去冰/五分糖',
        sugar: '五分糖',
        toppings: JSON.stringify([])
      }
    ]);

    console.log('✅ 订单商品创建成功:', orderItems.length, '件商品');
    console.log('');

    // 6. 重新加载订单（包含商品）
    console.log('6. 重新加载订单...');
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    console.log('✅ 订单信息:');
    console.log('   商品总额:', completeOrder.product_total);
    console.log('   配送费:', completeOrder.delivery_fee);
    console.log('   订单总额:', completeOrder.final_price);
    console.log('   商品数量:', completeOrder.items.length);
    console.log('');

    // 7. 发送订单到外卖平台
    console.log('7. 发送订单到外卖平台...');
    console.log('   平台代码:', 'banxia');
    console.log('');

    const result = await sendOrderToPlatform(completeOrder, 'banxia');

    if (result.success) {
      console.log('✅ 订单发送成功！');
      console.log('   配送订单号:', result.data.order_no);
      console.log('   配送状态:', result.data.status);
      console.log('');

      // 8. 验证订单状态更新
      console.log('8. 验证订单状态更新...');
      const updatedOrder = await Order.findByPk(order.id);
      console.log('   平台订单号:', updatedOrder.platform_order_no);
      console.log('   配送状态:', updatedOrder.delivery_status);
      console.log('   平台状态:', updatedOrder.platform_status);
    } else {
      console.log('❌ 订单发送失败:', result.message);
    }

    console.log('\n========================================');
    console.log('   测试完成！');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testAutoDelivery().then(() => {
  console.log('\n测试脚本执行完毕');
  process.exit(0);
}).catch(error => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});
