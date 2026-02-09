/**
 * 向配送平台发送测试订单
 * 使用配置在 .env 中的 DELIVERY_API_URL
 */

const axios = require('axios');
const crypto = require('crypto');

// 从环境变量或配置文件中读取配送API地址
const DELIVERY_API_URL = process.env.DELIVERY_API_URL || 'http://localhost:5000/api/external';
const API_BASE = 'http://localhost:3000/api';

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

// 生成签名
function generateSignature(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const signString = sortedKeys
    .filter(key => typeof params[key] !== 'object' && !Array.isArray(params[key]))
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHmac('sha256', secret)
    .update(signString)
    .digest('hex');
}

// 获取时间戳
function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

// 发送订单
async function sendOrder() {
  try {
    console.log('========================================');
    console.log('   向配送平台发送测试订单');
    console.log('========================================\n');
    console.log('配送API地址:', DELIVERY_API_URL);
    console.log('平台代码: banxia');
    console.log('');

    const params = {
      platform_code: 'banxia',
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

    params.sign = generateSignature(params, 'local_test_secret');

    console.log('请求参数:');
    console.log(JSON.stringify(params, null, 2));
    console.log('');

    const response = await axios.post(
      `${DELIVERY_API_URL}/order/receive`,
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
      console.log('   状态:', response.data.data.status_text);
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

sendOrder().then(() => {
  console.log('测试完成！');
}).catch(error => {
  console.error('测试失败:', error.message);
  process.exit(1);
});
