// 后台与前端小程序API接口连接测试脚本
// 用于验证后台API与前端小程序调用的接口是否匹配

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 测试结果存储
const testResults = [];

function logResult(category, testName, success, message, data = null) {
  const result = {
    category,
    test: testName,
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);

  const icon = success ? '✓' : '✗';
  const status = success ? '通过' : '失败';
  console.log(`${icon} [${category}] ${testName}: ${status}`);
  if (message) console.log(`  ${message}`);
  if (data && !success) console.log(`  详情:`, JSON.stringify(data, null, 2));
  console.log('');
}

// ============ 前端小程序调用的API端点 ============

// 1. 用户相关接口
async function testUserAPIs() {
  console.log('========== 用户相关接口 ==========\n');

  try {
    // GET /users/profile - 获取用户信息
    const res = await axios.get(`${API_BASE}/users/profile`);
    logResult(
      '用户',
      'GET /users/profile',
      res.status === 200,
      '前端recharge.js调用此接口获取用户信息'
    );
  } catch (error) {
    logResult('用户', 'GET /users/profile', false, error.message);
  }

  try {
    // GET /users/points - 获取用户积分
    const res = await axios.get(`${API_BASE}/users/points`);
    logResult(
      '用户',
      'GET /users/points',
      res.status === 200,
      '前端可能调用此接口获取积分信息'
    );
  } catch (error) {
    logResult('用户', 'GET /users/points', false, error.message);
  }

  try {
    // GET /users - 获取用户列表（管理员）
    const res = await axios.get(`${API_BASE}/users?page=1&limit=5`);
    logResult(
      '用户',
      'GET /users (分页)',
      res.data && res.data.success,
      '后台管理页面调用此接口'
    );
  } catch (error) {
    logResult('用户', 'GET /users (分页)', false, error.message);
  }
}

// 2. 储值相关接口
async function testRechargeAPIs() {
  console.log('========== 储值相关接口 ==========\n');

  try {
    // GET /recharge/plans - 获取储值方案
    const res = await axios.get(`${API_BASE}/recharge/plans`);
    logResult(
      '储值',
      'GET /recharge/plans',
      res.data && res.data.success,
      '前端recharge.js调用此接口获取储值方案',
      res.data
    );
  } catch (error) {
    logResult('储值', 'GET /recharge/plans', false, error.message);
  }

  try {
    // POST /recharge/simple-recharge - 简化储值（小程序使用）
    const res = await axios.post(`${API_BASE}/recharge/simple-recharge`, {
      user_id: 39,
      amount: 1,
      remark: 'API连接测试'
    });
    logResult(
      '储值',
      'POST /recharge/simple-recharge',
      res.data && res.data.success,
      '前端recharge.js模拟支付成功后调用此接口',
      res.data
    );
  } catch (error) {
    logResult('储值', 'POST /recharge/simple-recharge', false, error.message);
  }

  try {
    // POST /recharge/confirm-payment - 确认支付
    const res = await axios.post(`${API_BASE}/recharge/confirm-payment`, {
      order_id: 'TEST_ORDER_' + Date.now(),
      user_id: 39,
      amount: 1
    });
    logResult(
      '储值',
      'POST /recharge/confirm-payment',
      res.data && res.data.success,
      '前端recharge.js支付成功确认时调用此接口'
    );
  } catch (error) {
    logResult('储值', 'POST /recharge/confirm-payment', false, error.message);
  }

  try {
    // GET /recharge/records - 获取储值记录
    const res = await axios.get(`${API_BASE}/recharge/records`);
    logResult(
      '储值',
      'GET /recharge/records',
      res.data && res.data.success,
      '后台管理页面调用此接口'
    );
  } catch (error) {
    logResult('储值', 'GET /recharge/records', false, error.message);
  }
}

// 3. 会员等级接口
async function testMemberLevelAPIs() {
  console.log('========== 会员等级接口 ==========\n');

  try {
    // GET /member-levels - 获取会员等级列表
    const res = await axios.get(`${API_BASE}/member-levels`);
    logResult(
      '会员',
      'GET /member-levels',
      Array.isArray(res.data),
      '前端和后台都调用此接口获取会员等级配置',
      { count: res.data.length }
    );
  } catch (error) {
    logResult('会员', 'GET /member-levels', false, error.message);
  }
}

// 4. UI配置接口
async function testUIAPIs() {
  console.log('========== UI配置接口 ==========\n');

  try {
    // GET /ui/theme-config - 获取主题配置
    const res = await axios.get(`${API_BASE}/ui/theme-config`);
    logResult(
      'UI',
      'GET /ui/theme-config',
      res.status === 200,
      '前端app.js调用此接口加载主题配置',
      res.data
    );
  } catch (error) {
    logResult('UI', 'GET /ui/theme-config', false, error.message);
  }

  try {
    // GET /ui/banners - 获取Banner图
    const res = await axios.get(`${API_BASE}/ui/banners`, {
      params: { position: 'recharge', is_active: 1 }
    });
    logResult(
      'UI',
      'GET /ui/banners',
      res.status === 200,
      '前端recharge.js调用此接口获取储值页Banner图'
    );
  } catch (error) {
    logResult('UI', 'GET /ui/banners', false, error.message);
  }
}

// 5. 商品和订单接口
async function testProductAndOrderAPIs() {
  console.log('========== 商品和订单接口 ==========\n');

  try {
    // GET /products - 获取商品列表
    const res = await axios.get(`${API_BASE}/products`);
    logResult(
      '商品',
      'GET /products',
      res.data && res.data.success,
      '首页和商品页面调用此接口'
    );
  } catch (error) {
    logResult('商品', 'GET /products', false, error.message);
  }

  try {
    // GET /orders - 获取订单列表
    const res = await axios.get(`${API_BASE}/orders`);
    logResult(
      '订单',
      'GET /orders',
      res.data && res.data.success,
      '订单页面调用此接口'
    );
  } catch (error) {
    logResult('订单', 'GET /orders', false, error.message);
  }
}

// 6. 优惠券接口
async function testCouponAPIs() {
  console.log('========== 优惠券接口 ==========\n');

  try {
    // GET /coupons - 获取优惠券列表
    const res = await axios.get(`${API_BASE}/coupons`);
    logResult(
      '优惠券',
      'GET /coupons',
      res.data && res.data.coupons,
      '优惠券页面调用此接口'
    );
  } catch (error) {
    logResult('优惠券', 'GET /coupons', false, error.message);
  }
}

// 7. 店铺接口
async function testStoreAPIs() {
  console.log('========== 店铺接口 ==========\n');

  try {
    // GET /stores - 获取店铺列表
    const res = await axios.get(`${API_BASE}/stores`);
    logResult(
      '店铺',
      'GET /stores',
      res.data && res.data.stores,
      '店铺管理页面调用此接口'
    );
  } catch (error) {
    logResult('店铺', 'GET /stores', false, error.message);
  }
}

// 8. 配置检查
function checkConfiguration() {
  console.log('========== 配置检查 ==========\n');

  const frontendConfig = {
    apiBaseUrl: 'https://192.168.3.61:3001/api',
    baseUrl: 'https://192.168.3.61:3001'
  };

  const backendConfig = {
    apiBaseUrl: 'http://localhost:3000/api',
    baseUrl: 'http://localhost:3000'
  };

  console.log('前端配置 (app.js):');
  console.log('  apiBaseUrl:', frontendConfig.apiBaseUrl);
  console.log('  baseUrl:', frontendConfig.baseUrl);
  console.log('');

  console.log('后端实际配置:');
  console.log('  apiBaseUrl:', backendConfig.apiBaseUrl);
  console.log('  baseUrl:', backendConfig.baseUrl);
  console.log('');

  const configMatch = frontendConfig.apiBaseUrl === backendConfig.apiBaseUrl;
  logResult(
    '配置',
    '前后端API地址匹配',
    configMatch,
    configMatch ? '配置一致' : '⚠️ 配置不匹配！需要修改前端app.js中的apiBaseUrl'
  );

  // 生成配置建议
  console.log('');
  console.log('========== 配置建议 ==========');
  console.log('');
  console.log('方案1: 修改前端配置（推荐用于开发）');
  console.log('在 app.js 中修改配置为:');
  console.log(`  apiBaseUrl: '${backendConfig.apiBaseUrl}',`);
  console.log(`  baseUrl: '${backendConfig.baseUrl}'`);
  console.log('');
  console.log('方案2: 修改后端监听地址');
  console.log('确保后端监听所有网络接口（0.0.0.0）而非仅localhost');
  console.log('');
  console.log('方案3: 使用局域网IP（推荐用于真机调试）');
  console.log('获取电脑局域网IP后，在app.js中配置:');
  console.log('  apiBaseUrl: \'http://192.168.x.x:3000/api\',');
  console.log('  baseUrl: \'http://192.168.x.x:3000\'');
  console.log('');
}

// 生成测试报告
function generateReport() {
  console.log('\n========== API连接测试报告 ==========\n');

  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;

  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('');

  // 按分类统计
  const categories = {};
  testResults.forEach(r => {
    if (!categories[r.category]) {
      categories[r.category] = { total: 0, passed: 0, failed: 0 };
    }
    categories[r.category].total++;
    if (r.success) {
      categories[r.category].passed++;
    } else {
      categories[r.category].failed++;
    }
  });

  console.log('分类统计:');
  Object.keys(categories).forEach(cat => {
    const { total, passed, failed } = categories[cat];
    console.log(`  ${cat}: ${passed}/${total} 通过${failed > 0 ? ` (${failed}失败)` : ''}`);
  });
  console.log('');

  // 失败的测试
  const failed = testResults.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('失败的测试:');
    failed.forEach(f => {
      console.log(`  ✗ [${f.category}] ${f.test}`);
      console.log(`    原因: ${f.message}`);
    });
    console.log('');
  }

  console.log('=====================================\n');
}

// 主测试流程
async function runTests() {
  console.log('\n');
  console.log('========================================');
  console.log('   后台与前端小程序API接口连接测试');
  console.log('========================================');
  console.log('\n');

  // 配置检查
  checkConfiguration();

  // API测试
  await testUserAPIs();
  await testRechargeAPIs();
  await testMemberLevelAPIs();
  await testUIAPIs();
  await testProductAndOrderAPIs();
  await testCouponAPIs();
  await testStoreAPIs();

  // 生成报告
  generateReport();

  console.log('========== 接口连接检查完成 ==========');
  console.log('');
  console.log('注意事项:');
  console.log('1. 确保前端app.js中的apiBaseUrl与后端地址一致');
  console.log('2. 确保后端服务器正在运行');
  console.log('3. 确保网络连接正常（真机调试时使用同一WiFi）');
  console.log('4. 检查后端CORS配置是否允许前端域名');
  console.log('');
}

// 执行测试
runTests().catch(err => {
  console.error('测试执行出错:', err);
  process.exit(1);
});
