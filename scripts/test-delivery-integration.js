/**
 * 配送平台集成测试
 * 根据 MINIPROGRAM_INTEGRATION_GUIDE.md 文档测试完整流程
 * 
 * 用法: node scripts/test-delivery-integration.js [平台代码]
 */

const axios = require('axios');

// API基础地址
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

// 测试订单数据
const testOrderData = {
  userId: 1,
  shopId: 1,
  shopName: '半夏奶茶店（测试店）',
  shopAddress: '北京市朝阳区三里屯路88号',
  shopPhone: '010-12345678',
  shopLat: 39.908692,
  shopLng: 116.397477,
  customerName: '测试顾客',
  customerPhone: '13800138000',
  customerAddress: '北京市朝阳区三里屯SOHO A座1201',
  customerLat: 39.918692,
  customerLng: 116.407477,
  items: [
    { name: '招牌奶茶(大杯/少冰/七分糖)', quantity: 2, price: 18.00 },
    { name: '芝士奶盖茶(中杯/去冰/五分糖)', quantity: 1, price: 22.00 }
  ],
  goodsAmount: 58.00,
  deliveryFee: 5.00,
  totalAmount: 63.00,
  remark: '请尽快送达，谢谢！',
  deliveryType: 'delivery'
};

// 获取平台列表
async function getPlatforms() {
  try {
    const response = await axios.get(`${API_BASE}/delivery-platforms/all`);
    if (response.data.success) {
      return response.data.platforms;
    }
    return [];
  } catch (error) {
    console.error('获取平台列表失败:', error.message);
    return [];
  }
}

// 测试签名生成
async function testSignature(platformId) {
  try {
    console.log('\n========== 测试签名生成 ==========');
    console.log('平台ID:', platformId);
    console.log('====================================\n');

    const response = await axios.post(
      `${API_BASE}/delivery-platforms/${platformId}/test-signature`,
      {},
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    console.log('签名测试结果:', response.data.success ? '成功' : '失败');
    if (response.data.data) {
      console.log('API地址:', response.data.data.apiUrl);
      console.log('签名:', response.data.data.sign);
    }

    return response.data;
  } catch (error) {
    console.error('签名测试失败:', error.message);
    throw error;
  }
}

// 测试创建订单并发送配送
async function testCreateOrder(platformCode) {
  try {
    console.log('\n========== 测试创建订单并发送配送 ==========');
    console.log('平台代码:', platformCode);
    console.log('==============================================\n');

    const orderData = {
      ...testOrderData,
      platformCode
    };

    console.log('订单数据:', JSON.stringify(orderData, null, 2));
    console.log('');

    // 这里应该调用实际的订单创建API
    // 由于需要完整的订单流程，我们先测试配送服务直接发送
    const response = await axios.post(
      `${API_BASE}/delivery-platforms/1/send-order`,
      { 
        orderData: {
          orderNo: `TEST${Date.now()}`,
          shopName: orderData.shopName,
          shopAddress: orderData.shopAddress,
          shopPhone: orderData.shopPhone,
          shopLat: orderData.shopLat,
          shopLng: orderData.shopLng,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerAddress: orderData.customerAddress,
          customerLat: orderData.customerLat,
          customerLng: orderData.customerLng,
          items: orderData.items,
          goodsAmount: orderData.goodsAmount,
          deliveryFee: orderData.deliveryFee,
          totalAmount: orderData.totalAmount,
          remark: orderData.remark
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    console.log('响应结果:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('创建订单失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
    throw error;
  }
}

// 测试查询配送状态
async function testQueryStatus(orderNo) {
  try {
    console.log('\n========== 测试查询配送状态 ==========');
    console.log('订单号:', orderNo);
    console.log('======================================\n');

    const response = await axios.get(
      `${API_BASE}/delivery/status/${orderNo}`,
      { timeout: 10000 }
    );

    console.log('查询结果:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('查询状态失败:', error.message);
    throw error;
  }
}

// 测试回调接口
async function testCallback() {
  try {
    console.log('\n========== 测试配送回调接口 ==========');
    console.log('======================================\n');

    // 模拟回调数据
    const callbackData = {
      app_key: 'test_app_key',
      order_no: 'DL123456789',
      external_order_no: 'TEST123456',
      status: 'accepted',
      status_text: '已接单',
      rider_info: {
        name: '张骑手',
        phone: '13900139000'
      },
      rider_lat: 39.915,
      rider_lng: 116.405,
      timestamp: Math.floor(Date.now() / 1000),
      sign: 'test_sign'
    };

    console.log('回调数据:', JSON.stringify(callbackData, null, 2));
    console.log('');

    const response = await axios.post(
      `${API_BASE}/delivery/callback`,
      callbackData,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    console.log('回调响应:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('回调测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
    throw error;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const platformCode = args[0];

  console.log('========================================');
  console.log('   配送平台集成测试工具');
  console.log('   根据 MINIPROGRAM_INTEGRATION_GUIDE.md');
  console.log('========================================\n');

  // 获取平台列表
  const platforms = await getPlatforms();
  if (platforms.length === 0) {
    console.log('没有配置任何配送平台，请先配置平台。');
    process.exit(1);
  }

  console.log('已配置的平台:');
  platforms.forEach(p => {
    console.log(`  [${p.id}] ${p.name} (${p.code}) - ${p.is_active ? '启用' : '禁用'}`);
  });
  console.log('');

  // 选择平台
  let targetPlatform = null;
  if (platformCode) {
    targetPlatform = platforms.find(p => p.code === platformCode);
  } else {
    targetPlatform = platforms.find(p => p.is_active);
  }

  if (!targetPlatform) {
    console.log('未找到指定的平台或没有启用的平台。');
    process.exit(1);
  }

  console.log(`使用平台: ${targetPlatform.name} (ID: ${targetPlatform.id}, 代码: ${targetPlatform.code})\n`);

  try {
    // 1. 测试签名
    await testSignature(targetPlatform.id);

    // 2. 测试创建订单
    await testCreateOrder(targetPlatform.code);

    // 3. 测试回调接口
    await testCallback();

    console.log('\n========================================');
    console.log('   所有测试完成！');
    console.log('========================================');

  } catch (error) {
    console.error('\n测试过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('程序执行出错:', error);
  process.exit(1);
});
