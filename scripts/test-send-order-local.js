/**
 * 测试向本地模拟外卖平台发送订单
 * 用法: node scripts/test-send-order-local.js [平台代码]
 * 默认使用 meituan 平台代码
 */

const axios = require('axios');
const crypto = require('crypto');

// 模拟服务器地址
const MOCK_SERVER_URL = 'http://localhost:3456';

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

// 发送订单到模拟服务器
async function sendOrderToMockServer(platformCode, orderData, appSecret) {
  try {
    console.log('\n========== 发送测试订单到模拟服务器 ==========');
    console.log('平台代码:', platformCode);
    console.log('订单号:', orderData.orderNo);
    console.log('==============================================\n');

    // 构建请求参数
    const params = {
      platform_code: platformCode,
      external_order_no: orderData.orderNo,
      timestamp: getTimestamp(),
      merchant_name: orderData.shopName,
      merchant_address: orderData.shopAddress,
      merchant_phone: orderData.shopPhone,
      merchant_lat: orderData.shopLat,
      merchant_lng: orderData.shopLng,
      receiver_name: orderData.customerName,
      receiver_phone: orderData.customerPhone,
      receiver_address: orderData.customerAddress,
      receiver_lat: orderData.customerLat,
      receiver_lng: orderData.customerLng,
      goods_info: JSON.stringify(orderData.items),
      goods_amount: orderData.goodsAmount,
      delivery_fee: orderData.deliveryFee,
      total_amount: orderData.totalAmount,
      remark: orderData.remark || '',
      callback_url: 'http://localhost:3000/api/delivery/callback'
    };

    // 生成签名
    params.sign = generateSignature(params, appSecret);

    console.log('请求参数:');
    console.log(JSON.stringify(params, null, 2));
    console.log('');

    // 发送请求
    const response = await axios.post(
      `${MOCK_SERVER_URL}/order/receive`,
      params,
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n========== 响应结果 ==========');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    console.log('==============================\n');

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

// 查询订单状态
async function queryOrderStatus(deliveryOrderNo, platformCode, appSecret) {
  try {
    console.log('\n========== 查询订单状态 ==========');
    console.log('配送订单号:', deliveryOrderNo);
    console.log('==================================\n');

    const params = {
      platform_code: platformCode,
      order_no: deliveryOrderNo,
      timestamp: getTimestamp()
    };

    params.sign = generateSignature(params, appSecret);

    const response = await axios.get(
      `${MOCK_SERVER_URL}/order/status`,
      { params }
    );

    console.log('\n========== 查询结果 ==========');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    console.log('==============================\n');

    return response.data;
  } catch (error) {
    console.error('\n========== 查询失败 ==========');
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

// 取消订单
async function cancelOrder(deliveryOrderNo, platformCode, appSecret, reason = '') {
  try {
    console.log('\n========== 取消订单 ==========');
    console.log('配送订单号:', deliveryOrderNo);
    console.log('取消原因:', reason || '无');
    console.log('==============================\n');

    const params = {
      platform_code: platformCode,
      order_no: deliveryOrderNo,
      cancel_reason: reason,
      timestamp: getTimestamp()
    };

    params.sign = generateSignature(params, appSecret);

    const response = await axios.post(
      `${MOCK_SERVER_URL}/order/cancel`,
      params
    );

    console.log('\n========== 取消结果 ==========');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    console.log('==============================\n');

    return response.data;
  } catch (error) {
    console.error('\n========== 取消失败 ==========');
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

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const platformCode = args[0] || 'meituan';
  const appSecret = 'test-secret-key-123456'; // 模拟密钥

  console.log('========================================');
  console.log('   外卖平台测试订单发送工具（本地）');
  console.log('========================================\n');
  console.log('目标服务器:', MOCK_SERVER_URL);
  console.log('平台代码:', platformCode);
  console.log('');

  try {
    // 1. 发送订单
    const sendResult = await sendOrderToMockServer(platformCode, testOrderData, appSecret);

    if (sendResult.code !== 0) {
      console.error('订单发送失败:', sendResult.message);
      process.exit(1);
    }

    const deliveryOrderNo = sendResult.data.order_no;
    console.log('✅ 订单发送成功！');
    console.log('   配送订单号:', deliveryOrderNo);
    console.log('   状态:', sendResult.data.status_text);

    // 2. 查询订单状态
    await queryOrderStatus(deliveryOrderNo, platformCode, appSecret);

    // 3. 取消订单（可选）
    // await cancelOrder(deliveryOrderNo, platformCode, appSecret, '顾客取消订单');

    console.log('\n========================================');
    console.log('   测试完成！');
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
