const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const ADMIN_TOKEN = 'your_admin_token_here'; // 需要从浏览器获取

async function testActivityAPI() {
  try {
    console.log('测试活动列表 API...');
    
    // 先测试不带认证的情况
    console.log('\n1. 测试不带认证:');
    try {
      const response = await axios.get(`${API_URL}/admin/activities?page=1`);
      console.log('响应:', response.data);
    } catch (error) {
      console.log('错误状态:', error.response?.status);
      console.log('错误数据:', error.response?.data);
    }

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testActivityAPI();
