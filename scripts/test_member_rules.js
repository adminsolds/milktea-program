// 测试新会员规则的脚本
// 规则：任意金额充值后转换为积分（1元=1积分），积分全部转换为成长值（1积分=1成长值）
// 首次充值（member_level === 'normal'）后自动升级为会员

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 测试数据
let testUserId = null;
let testResults = [];

function logResult(testName, success, message, data = null) {
  const result = {
    test: testName,
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);

  const icon = success ? '✓' : '✗';
  const status = success ? '通过' : '失败';
  console.log(`${icon} ${testName}: ${status}`);
  if (message) console.log(`  ${message}`);
  if (data) console.log(`  数据:`, JSON.stringify(data, null, 2));
  console.log('');
}

// 1. 获取或创建测试用户
async function getOrCreateTestUser() {
  try {
    console.log('========== 1. 获取或创建测试用户 ==========\n');
    console.log('提示：请先确保数据库中有一个测试用户，或使用现有的用户ID进行测试\n');

    // 首先尝试获取用户列表，看是否有测试用户
    try {
      const response = await axios.get(`${API_BASE}/users?page=1&limit=10`);
      if (response.data && response.data.data && response.data.data.length > 0) {
        // 使用第一个用户作为测试用户
        const user = response.data.data[0];
        testUserId = user.id;

        logResult(
          '获取测试用户',
          true,
          `使用现有用户: ID=${testUserId}, 昵称=${user.nickname || '未设置'}, 会员等级=${user.member_level}, 积分=${user.points || 0}, 成长值=${user.growth_value || 0}`,
          user
        );
        return user;
      }
    } catch (err) {
      // 如果获取用户列表失败，继续尝试其他方法
    }

    // 如果没有现有用户，需要手动创建
    console.log('⚠️  未找到测试用户，请手动创建一个用户或指定用户ID');
    console.log('   可以通过以下方式创建测试用户：');
    console.log('   1. 使用小程序端登录创建用户');
    console.log('   2. 在后台用户管理页面手动添加');
    console.log('   3. 修改此脚本使用已知的用户ID\n');

    // 尝试使用小程序储值接口的方式（会自动创建测试用户）
    const testOpenid = `test_member_rules_${Date.now()}`;
    console.log(`尝试创建测试用户 (openid: ${testOpenid})...`);

    const rechargeResponse = await axios.post(`${API_BASE}/recharge/simple`, {
      user_id: 999999, // 不存在的用户ID
      amount: 0.01, // 最小金额
      remark: '创建测试用户',
      openid: testOpenid
    });

    // 这个请求可能会失败，但如果成功，会创建用户
    logResult(
      '创建测试用户',
      false,
      '自动创建用户功能未实现，请手动创建测试用户后重新运行脚本'
    );
    return null;

  } catch (error) {
    // 尝试解析错误信息，看是否包含用户ID
    if (error.response && error.response.data && error.response.data.user_id) {
      testUserId = error.response.data.user_id;
      logResult(
        '创建测试用户',
        true,
        `用户已创建: ID=${testUserId}, openid=${error.response.data.openid}`,
        error.response.data
      );
      return error.response.data;
    }

    logResult(
      '获取/创建测试用户',
      false,
      error.response?.data?.error || error.message
    );
    return null;
  }
}

// 2. 获取会员等级列表
async function getMemberLevels() {
  try {
    const response = await axios.get(`${API_BASE}/member-levels`);
    const levels = response.data;

    logResult(
      '获取会员等级列表',
      true,
      `共有 ${levels.length} 个会员等级`,
      levels
    );
    return levels;
  } catch (error) {
    logResult(
      '获取会员等级列表',
      false,
      error.response?.data?.error || error.message
    );
    return [];
  }
}

// 3. 测试小额充值（1元）- 应该从普通用户升级为会员
async function testSmallRecharge() {
  try {
    console.log('========== 3. 测试小额充值（1元） ==========\n');
    console.log('预期结果：充值1元 → 获得1积分 → 获得1成长值 → 从normal升级为最低会员等级\n');

    const response = await axios.post(`${API_BASE}/recharge/simple-recharge`, {
      user_id: testUserId,
      amount: 1,
      remark: '测试小额充值'
    });

    if (response.data && response.data.success) {
      const { new_balance, points_added, new_points, growth_added, new_growth, old_member_level, new_member_level, is_first_recharge } = response.data;

      const checks = {
        balanceIncreased: parseFloat(new_balance) > 0,
        pointsAdded: points_added === 1,
        growthAdded: growth_added === 1,
        wasNormal: old_member_level === 'normal',
        upgraded: new_member_level !== 'normal' && new_member_level !== old_member_level,
        isFirstRecharge: is_first_recharge === true
      };

      const allPassed = Object.values(checks).every(v => v === true);

      logResult(
        '小额充值（1元）',
        allPassed,
        allPassed
          ? '充值成功，积分、成长值计算正确，首次充值检测正确，会员等级已升级'
          : '部分检查未通过: ' + JSON.stringify(checks, null, 2),
        {
          checks,
          response: response.data
        }
      );

      return response.data;
    } else {
      logResult('小额充值（1元）', false, '充值失败', response.data);
      return null;
    }
  } catch (error) {
    logResult(
      '小额充值（1元）',
      false,
      error.response?.data?.error || error.message
    );
    return null;
  }
}

// 4. 测试中等金额充值（50元）- 应该获得50积分和50成长值
async function testMediumRecharge() {
  try {
    console.log('========== 4. 测试中等金额充值（50元） ==========\n');
    console.log('预期结果：充值50元 → 获得50积分 → 获得50成长值\n');

    const response = await axios.post(`${API_BASE}/recharge/simple-recharge`, {
      user_id: testUserId,
      amount: 50,
      remark: '测试中等金额充值'
    });

    if (response.data && response.data.success) {
      const { points_added, growth_added, new_member_level } = response.data;

      const checks = {
        pointsAdded: points_added === 50,
        growthAdded: growth_added === 50,
        pointsEqualGrowth: points_added === growth_added
      };

      const allPassed = Object.values(checks).every(v => v === true);

      logResult(
        '中等金额充值（50元）',
        allPassed,
        allPassed
          ? `充值成功，获得${points_added}积分和${growth_added}成长值，当前等级：${new_member_level}`
          : '部分检查未通过: ' + JSON.stringify(checks, null, 2),
        {
          checks,
          response: response.data
        }
      );

      return response.data;
    } else {
      logResult('中等金额充值（50元）', false, '充值失败', response.data);
      return null;
    }
  } catch (error) {
    logResult(
      '中等金额充值（50元）',
      false,
      error.response?.data?.error || error.message
    );
    return null;
  }
}

// 5. 测试大额充值（200元）- 验证积分和成长值计算
async function testLargeRecharge() {
  try {
    console.log('========== 5. 测试大额充值（200元） ==========\n');
    console.log('预期结果：充值200元 → 获得200积分 → 获得200成长值\n');

    const response = await axios.post(`${API_BASE}/recharge/simple-recharge`, {
      user_id: testUserId,
      amount: 200,
      remark: '测试大额金额充值'
    });

    if (response.data && response.data.success) {
      const { points_added, growth_added, new_points, new_growth, new_member_level } = response.data;

      const checks = {
        pointsAdded: points_added === 200,
        growthAdded: growth_added === 200,
        pointsEqualGrowth: points_added === growth_added
      };

      const allPassed = Object.values(checks).every(v => v === true);

      logResult(
        '大额金额充值（200元）',
        allPassed,
        allPassed
          ? `充值成功，获得${points_added}积分和${growth_added}成长值，总积分：${new_points}，总成长值：${new_growth}，当前等级：${new_member_level}`
          : '部分检查未通过: ' + JSON.stringify(checks, null, 2),
        {
          checks,
          response: response.data
        }
      );

      return response.data;
    } else {
      logResult('大额金额充值（200元）', false, '充值失败', response.data);
      return null;
    }
  } catch (error) {
    logResult(
      '大额金额充值（200元）',
      false,
      error.response?.data?.error || error.message
    );
    return null;
  }
}

// 6. 获取用户最终状态（使用储值接口返回的数据）
async function getUserFinalStatus(lastRechargeData) {
  try {
    console.log('========== 6. 获取用户最终状态 ==========\n');

    if (lastRechargeData && lastRechargeData.success) {
      const { new_balance, new_points, new_growth, new_member_level } = lastRechargeData;

      logResult(
        '获取用户最终状态',
        true,
        `会员等级: ${new_member_level}, 积分: ${new_points}, 成长值: ${new_growth}, 余额: ${new_balance}`,
        {
          user_id: testUserId,
          member_level: new_member_level,
          points: new_points,
          growth_value: new_growth,
          balance: new_balance
        }
      );
      return lastRechargeData;
    } else {
      logResult('获取用户最终状态', false, '无法获取用户数据');
      return null;
    }
  } catch (error) {
    logResult(
      '获取用户最终状态',
      false,
      error.response?.data?.error || error.message
    );
    return null;
  }
}

// 7. 验证积分与成长值的关系
async function verifyPointsAndGrowth(rechargeData) {
  try {
    console.log('========== 7. 验证积分与成长值的关系 ==========\n');
    console.log('规则：充值金额 → 积分（1:1），积分 → 成长值（1:1）\n');
    console.log('预期：积分应该等于成长值（扣除储值方案赠送积分的差异）\n');

    if (rechargeData && rechargeData.success) {
      const { points_added, growth_added, new_points, new_growth } = rechargeData;

      // 验证本次充值的积分和成长值是否相等
      const pointsEqualGrowth = points_added === growth_added;

      const checks = {
        hasPoints: new_points > 0,
        hasGrowth: new_growth > 0,
        pointsEqualGrowth: pointsEqualGrowth
      };

      const allPassed = Object.values(checks).every(v => v === true);

      logResult(
        '验证积分与成长值关系',
        allPassed,
        allPassed
          ? `积分和成长值计算正确（本次增加积分: ${points_added}, 成长值: ${growth_added}, 总积分: ${new_points}, 总成长值: ${new_growth}）`
          : '验证未通过: ' + JSON.stringify(checks, null, 2),
        { checks, rechargeData }
      );

      return { passed: allPassed, points: new_points, growth_value: new_growth };
    } else {
      logResult('验证积分与成长值关系', false, '无法获取充值数据');
      return { passed: false };
    }
  } catch (error) {
    logResult(
      '验证积分与成长值关系',
      false,
      error.response?.data?.error || error.message
    );
    return { passed: false };
  }
}

// 生成测试报告
function generateReport() {
  console.log('\n========== 测试报告 ==========\n');
  console.log('总测试数:', testResults.length);
  console.log('通过:', testResults.filter(r => r.success).length);
  console.log('失败:', testResults.filter(r => r.success === false).length);
  console.log('');

  console.log('详细结果:');
  testResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.test}: ${result.success ? '通过 ✓' : '失败 ✗'}`);
    if (result.message) console.log(`   ${result.message}`);
  });

  console.log('\n========== 新会员规则验证 ==========\n');
  console.log('规则说明:');
  console.log('1. 用户首次登录时为普通用户（member_level = normal）');
  console.log('2. 充值任意金额后转为积分（1元 = 1积分）');
  console.log('3. 积分全部转换为成长值（1积分 = 1成长值）');
  console.log('4. 根据成长值自动升级会员等级');
  console.log('5. 储值方案的赠送积分额外增加到总积分中\n');

  const allPassed = testResults.every(r => r.success);
  if (allPassed) {
    console.log('✓ 所有测试通过！新会员规则实现正确。\n');
  } else {
    console.log('✗ 部分测试失败，请检查实现。\n');
  }

  console.log('=========================\n');
}

// 主测试流程
async function runTests() {
  console.log('\n');
  console.log('========================================');
  console.log('   新会员规则测试脚本');
  console.log('========================================');
  console.log('\n');

  try {
    // 1. 获取或创建测试用户
    const user = await getOrCreateTestUser();
    if (!user || !testUserId) {
      console.log('无法获取测试用户，测试终止');
      console.log('提示：请在数据库中手动创建一个用户，或将testUserId设置为现有用户ID');
      return;
    }

    // 2. 获取会员等级列表
    const levels = await getMemberLevels();
    if (levels.length === 0) {
      console.log('警告：没有会员等级配置，自动升级可能无法正常工作');
    }

    // 3. 测试小额充值
    const smallRechargeResult = await testSmallRecharge();

    // 4. 测试中等金额充值
    const mediumRechargeResult = await testMediumRecharge();

    // 5. 测试大额充值
    const largeRechargeResult = await testLargeRecharge();

    // 6. 获取用户最终状态（使用最后一次充值的数据）
    await getUserFinalStatus(largeRechargeResult);

    // 7. 验证积分与成长值的关系（使用最后一次充值的数据）
    await verifyPointsAndGrowth(largeRechargeResult);

    // 生成测试报告
    generateReport();

  } catch (error) {
    console.error('测试执行出错:', error.message);
  }
}

// 执行测试
runTests().catch(err => {
  console.error('测试脚本执行失败:', err);
  process.exit(1);
});
