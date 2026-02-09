/**
 * 测试回调地址是否可用
 */

const axios = require('axios');

const CALLBACK_URL = 'http://localhost:3000/api/delivery/callback';

async function testCallbackUrl() {
  console.log('========================================');
  console.log('   测试回调地址可用性');
  console.log('========================================\n');
  console.log('回调地址:', CALLBACK_URL);
  console.log('');

  try {
    // 测试1: 发送一个基本的回调请求
    console.log('测试1: 发送基本回调请求...');
    const response = await axios.post(CALLBACK_URL, {
      app_key: 'local_test_key',
      order_no: 'DL123456',
      external_order_no: 'TEST123456',
      status: 'accepted',
      status_text: '已接单',
      timestamp: Math.floor(Date.now() / 1000)
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

    console.log('✅ 回调地址可用！');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    if (error.response) {
      // 服务器响应了，但状态码不是2xx
      console.log('⚠️  服务器响应了（可能验证失败）');
      console.log('状态码:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
      return true; // 地址是可达的
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ 连接被拒绝，服务器可能没有运行');
      console.log('错误:', error.message);
      return false;
    } else {
      console.log('❌ 请求失败');
      console.log('错误:', error.message);
      return false;
    }
  }
}

testCallbackUrl().then(available => {
  console.log('\n========================================');
  if (available) {
    console.log('   回调地址可用 ✅');
  } else {
    console.log('   回调地址不可用 ❌');
  }
  console.log('========================================');
  process.exit(available ? 0 : 1);
});
