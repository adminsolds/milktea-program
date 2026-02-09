// 简单的API测试脚本
const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

console.log('========== 测试用户管理API ==========\n');

// 测试获取用户列表
async function testGetUsers() {
  try {
    console.log('1. 测试获取用户列表...');
    const response = await axios.get(`${API_BASE}/users?page=1&limit=10`);
    console.log('✓ 成功获取用户列表');
    console.log('  - 状态码:', response.status);
    console.log('  - 返回数据:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('✗ 获取用户列表失败');
    console.error('  - 错误信息:', error.message);
    if (error.response) {
      console.error('  - 响应状态:', error.response.status);
      console.error('  - 响应数据:', error.response.data);
    }
    return null;
  }
}

// 测试获取会员等级
async function testGetMemberLevels() {
  try {
    console.log('\n2. 测试获取会员等级...');
    const response = await axios.get(`${API_BASE}/member-levels`);
    console.log('✓ 成功获取会员等级');
    console.log('  - 状态码:', response.status);
    console.log('  - 会员等级数量:', response.data ? response.data.length : 0);
    return response.data;
  } catch (error) {
    console.error('✗ 获取会员等级失败');
    console.error('  - 错误信息:', error.message);
    return null;
  }
}

// 运行所有测试
async function runTests() {
  const usersResult = await testGetUsers();
  const levelsResult = await testGetMemberLevels();

  console.log('\n========== 测试总结 ==========');
  if (usersResult && usersResult.success) {
    console.log(`✓ 用户数据正常，共 ${usersResult.total} 个用户`);
  } else {
    console.log('✗ 用户数据获取失败或数据库为空');
  }

  if (levelsResult && Array.isArray(levelsResult)) {
    console.log(`✓ 会员等级正常，共 ${levelsResult.length} 个等级`);
  } else {
    console.log('✗ 会员等级获取失败');
  }

  console.log('\n========== 建议 ==========');
  if (!usersResult || !usersResult.success) {
    console.log('- 请检查数据库是否正常运行');
    console.log('- 请检查数据库连接配置（.env文件）');
    console.log('- 请确认users表是否存在');
    console.log('- 请查看后端服务器控制台日志');
  }
  console.log('=========================\n');
}

// 执行测试
runTests().catch(err => {
  console.error('测试执行出错:', err);
  process.exit(1);
});
