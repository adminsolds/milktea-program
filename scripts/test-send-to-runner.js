/**
 * 向跑腿小程序发送测试订单
 * 使用HMAC-SHA256签名算法
 */

const axios = require('axios');
const crypto = require('crypto');

// 跑腿小程序API地址
const RUNNER_API_URL = 'http://localhost:5000/api/external';

// 平台配置（使用跑腿小程序数据库中已有的配置）
const PLATFORM_CONFIG = {
  platformCode: 'banxia',  // 跑腿小程序数据库中已配置的平台代码
  apiKey: 'ak_ydejnb2601rml428c1n',
  apiSecret: 'sk_ttl6wnosjyml4yrjww_ndl2msim'
};

// 测试订单数据
const testOrderData = {
  orderNo: `TEST${Date.now()}`,
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
  remark: '请尽快送达，谢谢！'
};

/**
 * 生成HMAC-SHA256签名（与跑腿小程序一致）
 */
function generateSignature(apiSecret, params) {
  // 按key排序参数
  const sortedKeys = Object.keys(params).sort();
  const signStr = sortedKeys
    .filter(key => params[key] !== undefined && params[key] !== null && key !== 'sign')
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return crypto
    .createHmac('sha256', apiSecret)
    .update(signStr)
    .digest('hex');
}

/**
 * 获取时间戳
 */
function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * 发送订单到跑腿小程序
 */
async function sendOrderToRunner() {
  try {
    console.log('========================================');
    console.log('   向跑腿小程序发送测试订单');
    console.log('========================================\n');
    console.log('API地址:', RUNNER_API_URL);
    console.log('平台代码:', PLATFORM_CONFIG.platformCode);
    console.log('');

    // 构建请求参数
    const params = {
      platform_code: PLATFORM_CONFIG.platformCode,
      external_order_no: testOrderData.orderNo,
      timestamp: getTimestamp(),
      merchant_name: testOrderData.shopName,
      merchant_address: testOrderData.shopAddress,
      merchant_phone: testOrderData.shopPhone,
      merchant_lat: testOrderData.shopLat,
      merchant_lng: testOrderData.shopLng,
      receiver_name: testOrderData.customerName,
      receiver_phone: testOrderData.customerPhone,
      receiver_address: testOrderData.customerAddress,
      receiver_lat: testOrderData.customerLat,
      receiver_lng: testOrderData.customerLng,
      goods_info: JSON.stringify(testOrderData.items),
      goods_amount: testOrderData.goodsAmount,
      delivery_fee: testOrderData.deliveryFee,
      total_amount: testOrderData.totalAmount,
      remark: testOrderData.remark || '',
      callback_url: 'http://localhost:3000/api/delivery/callback'
    };

    // 生成签名
    params.sign = generateSignature(PLATFORM_CONFIG.apiSecret, params);

    console.log('请求参数:');
    console.log(JSON.stringify(params, null, 2));
    console.log('');

    // 发送请求
    const response = await axios.post(
      `${RUNNER_API_URL}/order/receive`,
      params,
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('\n========== 响应结果 ==========');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    console.log('==============================\n');

    if (response.data.code === 0) {
      console.log('✅ 订单发送成功！');
      console.log('   配送订单号:', response.data.data.order_no);
      console.log('   状态:', response.data.data.status);
    } else {
      console.log('❌ 订单发送失败:', response.data.message);
      
      // 如果是平台未找到，提示用户需要在跑腿小程序中配置平台
      if (response.data.code === 1003) {
        console.log('\n⚠️  提示: 需要在跑腿小程序数据库中配置平台');
        console.log('   平台代码:', PLATFORM_CONFIG.platformCode);
        console.log('   API Key:', PLATFORM_CONFIG.apiKey);
        console.log('   API Secret:', PLATFORM_CONFIG.apiSecret);
      }
    }

    return response.data;
  } catch (error) {
    console.error('\n========== 发送失败 ==========');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    console.error('==============================\n');
    throw error;
  }
}

/**
 * 测试签名生成
 */
async function testSignature() {
  try {
    console.log('\n========== 测试签名生成 ==========');
    
    const testData = {
      platform_code: PLATFORM_CONFIG.platformCode,
      external_order_no: 'TEST' + Date.now(),
      timestamp: getTimestamp(),
      receiver_name: '测试',
      receiver_phone: '13800138000'
    };

    const signature = generateSignature(PLATFORM_CONFIG.apiSecret, testData);
    
    console.log('测试数据:', JSON.stringify(testData, null, 2));
    console.log('生成的签名:', signature);
    console.log('签名方法: HMAC-SHA256');
    console.log('==================================\n');

    // 调用跑腿小程序的测试签名接口
    const response = await axios.post(
      `${RUNNER_API_URL}/test-signature`,
      {
        platform_code: PLATFORM_CONFIG.platformCode
      }
    );

    console.log('跑腿小程序测试接口响应:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('签名测试失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
    }
  }
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('   奶茶店 → 跑腿小程序 订单发送测试');
  console.log('========================================\n');

  try {
    // 先测试签名
    await testSignature();
    
    // 发送订单
    await sendOrderToRunner();
    
    console.log('\n测试完成！');
  } catch (error) {
    console.error('测试失败:', error.message);
    process.exit(1);
  }
}

main();
