const { RechargePlan, RechargeRecord, User, MemberLevel, SystemConfig } = require('../models');
const { createBalanceRecord } = require('./balanceController');

// 获取储值方案列表
const getRechargePlans = async (req, res) => {
  try {
    const plans = await RechargePlan.findAll({
      where: { is_active: 1 },
      order: [['sort_order', 'ASC'], ['amount', 'ASC']]
    });
    res.json({ success: true, plans });
  } catch (error) {
    console.error('获取储值方案失败:', error);
    res.status(500).json({ success: false, error: '获取储值方案失败' });
  }
};

// 添加储值方案
const addRechargePlan = async (req, res) => {
  try {
    const { name, amount, bonus_amount, bonus_points, sort_order, is_active } = req.body;

    const plan = await RechargePlan.create({
      name,
      amount,
      bonus_amount,
      bonus_points,
      sort_order: sort_order || 0,
      is_active: is_active || 1
    });

    res.json({ success: true, message: '储值方案添加成功', plan });
  } catch (error) {
    console.error('添加储值方案失败:', error);
    res.status(500).json({ success: false, error: '添加储值方案失败' });
  }
};

// 更新储值方案
const updateRechargePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, bonus_amount, bonus_points, sort_order, is_active } = req.body;

    const plan = await RechargePlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ success: false, error: '储值方案不存在' });
    }

    await plan.update({
      name,
      amount,
      bonus_amount,
      bonus_points,
      sort_order: sort_order || 0,
      is_active: is_active || 1
    });

    res.json({ success: true, message: '储值方案更新成功', plan });
  } catch (error) {
    console.error('更新储值方案失败:', error);
    res.status(500).json({ success: false, error: '更新储值方案失败' });
  }
};

// 删除储值方案
const deleteRechargePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await RechargePlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ success: false, error: '储值方案不存在' });
    }

    await plan.destroy();
    res.json({ success: true, message: '储值方案删除成功' });
  } catch (error) {
    console.error('删除储值方案失败:', error);
    res.status(500).json({ success: false, error: '删除储值方案失败' });
  }
};

// 切换储值方案状态
const toggleRechargePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await RechargePlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ success: false, error: '储值方案不存在' });
    }

    const newStatus = plan.is_active === 1 ? 0 : 1;
    await plan.update({ is_active: newStatus });

    res.json({ success: true, message: `储值方案已${newStatus === 1 ? '激活' : '禁用'}`, plan });
  } catch (error) {
    console.error('切换储值方案状态失败:', error);
    res.status(500).json({ success: false, error: '切换储值方案状态失败' });
  }
};

// 获取储值记录列表
const getRechargeRecords = async (req, res) => {
  try {
    const records = await RechargeRecord.findAll({
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'nickname', 'phone'],
        as: 'rechargeUser'
      }]
    });

    res.json({ success: true, records });
  } catch (error) {
    console.error('获取储值记录失败:', error);
    res.status(500).json({ success: false, error: '获取储值记录失败' });
  }
};

// 获取单个用户的储值记录
const getUserRechargeRecords = async (req, res) => {
  try {
    const { userId } = req.params;

    const records = await RechargeRecord.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, records });
  } catch (error) {
    console.error('获取用户储值记录失败:', error);
    res.status(500).json({ success: false, error: '获取用户储值记录失败' });
  }
};

// 管理员手动为用户储值
const adminRecharge = async (req, res) => {
  try {
    const { user_id, amount, bonus_amount, remark } = req.body;

    console.log('管理员储值请求:', { user_id, amount, bonus_amount, remark });

    // 验证用户是否存在
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const rechargeAmount = parseFloat(amount);
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: '充值金额必须大于0'
      });
    }

    // 计算总金额
    const total_amount = rechargeAmount + parseFloat(bonus_amount || 0);

    // 新会员规则：
    // 1. 充值金额转换为积分（1元=1积分）
    // 2. 积分全部转换为成长值（1积分=1成长值）
    const pointsFromAmount = Math.floor(rechargeAmount); // 充值金额转为积分
    const growthToAdd = pointsFromAmount; // 积分转成长值

    // 获取当前积分和成长值
    const currentPoints = parseInt(user.points) || 0;
    const currentGrowth = parseInt(user.growth_value) || 0;
    const newPoints = currentPoints + pointsFromAmount;
    const newGrowth = currentGrowth + growthToAdd;

    // 判断是否是首次充值
    const isFirstRecharge = user.member_level === 'normal';

    // 更新用户积分和成长值
    await user.update({
      points: newPoints,
      growth_value: newGrowth
    });

    console.log('管理员储值增加积分和成长值:', {
      rechargeAmount,
      pointsFromAmount,
      growthToAdd,
      currentPoints,
      newPoints,
      currentGrowth,
      newGrowth,
      isFirstRecharge
    });

    // 更新用户余额
    await user.update({
      balance: (parseFloat(user.balance) + total_amount).toFixed(2)
    });

    // 根据成长值自动升级会员等级
    await autoUpgradeMemberLevelForRecharge(user.id);

    // 创建储值记录
    const record = await RechargeRecord.create({
      user_id,
      amount: rechargeAmount,
      bonus_amount: bonus_amount || 0,
      total_amount: total_amount,
      recharge_type: 'admin',
      status: 'completed',
      remark
    });

    // 创建余额记录
    await createBalanceRecord(
      user_id,
      'recharge',
      total_amount,
      'recharge',
      record.id,
      remark || '管理员储值'
    );

    // 重新获取用户信息以获取最新的会员等级
    const updatedUser = await User.findByPk(user_id);

    console.log('管理员储值成功:', {
      user_id,
      amount: rechargeAmount,
      bonus_amount,
      total_amount,
      new_balance: updatedUser.balance,
      points_added: pointsFromAmount,
      new_points: updatedUser.points,
      growth_added: growthToAdd,
      new_growth: updatedUser.growth_value,
      old_member_level: user.member_level,
      new_member_level: updatedUser.member_level,
      is_first_recharge: isFirstRecharge
    });

    res.json({
      success: true,
      message: isFirstRecharge ? '恭喜您成为会员！' : '储值成功',
      record,
      new_balance: updatedUser.balance,
      points_added: pointsFromAmount,
      new_points: updatedUser.points,
      growth_added: growthToAdd,
      new_growth: updatedUser.growth_value,
      old_member_level: user.member_level,
      new_member_level: updatedUser.member_level,
      is_first_recharge: isFirstRecharge
    });
  } catch (error) {
    console.error('管理员储值失败:', error);
    res.status(500).json({ success: false, error: '管理员储值失败' });
  }
};

// 创建储值订单（小程序端）
const createRechargeOrder = async (req, res) => {
  try {
    const { amount, user_id, openid, remark } = req.body;

    console.log('创建储值订单请求:', { amount, user_id, openid, remark });

    // 查找对应的储值方案
    const plan = await RechargePlan.findOne({
      where: {
        amount: amount,
        is_active: 1
      }
    });

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: '未找到对应的储值方案'
      });
    }

    // 查找用户
    let user = await User.findByPk(user_id);
    if (!user) {
      // 如果用户不存在，创建一个测试用户
      console.log('用户不存在，创建测试用户');
      user = await User.create({
        openid: openid || 'test_openid_' + Date.now(),
        nickname: '测试用户',
        balance: 0
      });
      console.log('创建测试用户成功:', user.id);
    }

    // 生成订单ID
    const order_id = 'RECHARGE_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

    // 返回模拟支付参数（实际项目应调用微信支付API）
    res.json({
      success: true,
      message: '订单创建成功',
      order_id: order_id,
      payment_params: {
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        nonceStr: Math.random().toString(36).substring(2, 15),
        package: 'prepay_id=wx' + Math.random().toString(36).substring(2, 15),
        signType: 'MD5',
        paySign: 'MOCK_SIGN_' + Math.random().toString(36).substring(2, 15),
        order_id: order_id
      }
    });
  } catch (error) {
    console.error('创建储值订单失败:', error);
    res.status(500).json({ success: false, error: '创建储值订单失败' });
  }
};

// 确认支付成功（小程序端）
const confirmPayment = async (req, res) => {
  try {
    const { order_id, user_id, amount } = req.body;

    console.log('确认支付请求:', { order_id, user_id, amount });

    // 查找用户
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: '缺少金额参数'
      });
    }

    const rechargeAmount = parseFloat(amount);

    // 查找对应的储值方案获取赠送金额和积分
    const plan = await RechargePlan.findOne({
      where: { amount: amount, is_active: 1 }
    });

    const bonus_amount = plan ? parseFloat(plan.bonus_amount) : 0;
    const plan_bonus_points = plan ? parseInt(plan.bonus_points) : 0;
    const total_amount = rechargeAmount + bonus_amount;

    // 新会员规则：
    // 1. 充值金额转换为积分（1元=1积分）
    // 2. 储值方案的赠送积分额外增加
    // 3. 积分全部转换为成长值（1积分=1成长值）
    const pointsFromAmount = Math.floor(rechargeAmount); // 充值金额转为积分
    const totalPointsToAdd = pointsFromAmount + plan_bonus_points; // 总积分
    const growthToAdd = totalPointsToAdd; // 积分转成长值

    // 获取当前积分和成长值
    const currentPoints = parseInt(user.points) || 0;
    const currentGrowth = parseInt(user.growth_value) || 0;
    const newPoints = currentPoints + totalPointsToAdd;
    const newGrowth = currentGrowth + growthToAdd;

    // 判断是否是首次充值（member_level为normal表示普通用户）
    const isFirstRecharge = user.member_level === 'normal';

    // 更新用户积分和成长值
    await user.update({
      points: newPoints,
      growth_value: newGrowth
    });

    console.log('支付确认增加积分和成长值:', {
      rechargeAmount,
      pointsFromAmount,
      plan_bonus_points,
      totalPointsToAdd,
      growthToAdd,
      currentPoints,
      newPoints,
      currentGrowth,
      newGrowth,
      isFirstRecharge
    });

    // 更新用户余额
    const newBalance = (parseFloat(user.balance) || 0) + total_amount;
    await user.update({ balance: newBalance.toFixed(2) });

    // 根据成长值自动升级会员等级
    await autoUpgradeMemberLevelForRecharge(user.id);

    // 创建储值记录
    const record = await RechargeRecord.create({
      user_id: user_id,
      amount: amount,
      bonus_amount: bonus_amount,
      total_amount: total_amount,
      recharge_type: 'wxpay',
      status: 'completed',
      remark: `储值订单${order_id}`
    });

    // 创建余额记录
    await createBalanceRecord(
      user_id,
      'recharge',
      total_amount,
      'recharge',
      record.id,
      `储值订单${order_id}`
    );

    // 重新获取用户信息以获取最新的会员等级
    const updatedUser = await User.findByPk(user_id);

    console.log('储值成功:', {
      user_id,
      amount,
      bonus_amount,
      total_amount,
      new_balance: newBalance.toFixed(2),
      points_added: totalPointsToAdd,
      new_points: updatedUser.points,
      growth_added: growthToAdd,
      new_growth: updatedUser.growth_value,
      old_member_level: user.member_level,
      new_member_level: updatedUser.member_level,
      is_first_recharge: isFirstRecharge
    });

    res.json({
      success: true,
      message: isFirstRecharge ? '恭喜您成为会员！' : '储值成功',
      new_balance: newBalance.toFixed(2),
      total_amount: total_amount,
      bonus_amount: bonus_amount,
      points_added: totalPointsToAdd,
      new_points: updatedUser.points,
      growth_added: growthToAdd,
      new_growth: updatedUser.growth_value,
      old_member_level: user.member_level,
      new_member_level: updatedUser.member_level,
      is_first_recharge: isFirstRecharge,
      record: record
    });
  } catch (error) {
    console.error('确认支付失败:', error);
    res.status(500).json({ success: false, error: '确认支付失败' });
  }
};

// 简化的储值接口（直接储值，用于测试）
const simpleRecharge = async (req, res) => {
  try {
    const { user_id, amount, bonus_amount: frontendBonusAmount, remark } = req.body;

    console.log('简单储值请求:', { user_id, amount, bonus_amount: frontendBonusAmount, remark });

    // 查找用户
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    const rechargeAmount = parseFloat(amount);
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: '充值金额必须大于0'
      });
    }

    // 如果前端传入了bonus_amount，直接使用（用于自定义金额）
    // 否则查找对应的储值方案获取赠送金额和积分
    let bonus_amount = 0;
    let plan_bonus_points = 0;

    if (frontendBonusAmount !== undefined && frontendBonusAmount !== null) {
      // 前端明确指定了赠送金额（自定义储值场景）
      bonus_amount = parseFloat(frontendBonusAmount) || 0;
    } else {
      // 查找对应的储值方案
      const plan = await RechargePlan.findOne({
        where: { amount: rechargeAmount, is_active: 1 }
      });

      bonus_amount = plan ? parseFloat(plan.bonus_amount) : 0;
      plan_bonus_points = plan ? parseInt(plan.bonus_points) : 0;
    }

    const total_amount = rechargeAmount + bonus_amount;

    // 新会员规则：
    // 1. 充值金额转换为积分（1元=1积分）
    // 2. 储值方案的赠送积分额外增加
    // 3. 积分全部转换为成长值（1积分=1成长值）
    const pointsFromAmount = Math.floor(rechargeAmount); // 充值金额转为积分
    const totalPointsToAdd = pointsFromAmount + plan_bonus_points; // 总积分
    const growthToAdd = totalPointsToAdd; // 积分转成长值

    // 获取当前积分和成长值
    const currentPoints = parseInt(user.points) || 0;
    const currentGrowth = parseInt(user.growth_value) || 0;
    const newPoints = currentPoints + totalPointsToAdd;
    const newGrowth = currentGrowth + growthToAdd;

    // 判断是否是首次充值（member_level为normal表示普通用户）
    const isFirstRecharge = user.member_level === 'normal';

    // 更新用户积分和成长值
    await user.update({
      points: newPoints,
      growth_value: newGrowth
    });

    console.log('充值增加积分和成长值:', {
      rechargeAmount,
      pointsFromAmount,
      plan_bonus_points,
      totalPointsToAdd,
      growthToAdd,
      currentPoints,
      newPoints,
      currentGrowth,
      newGrowth,
      isFirstRecharge
    });

    // 更新用户余额
    const newBalance = (parseFloat(user.balance) || 0) + total_amount;
    await user.update({ balance: newBalance.toFixed(2) });

    // 根据成长值自动升级会员等级（任意金额充值后都会尝试升级）
    await autoUpgradeMemberLevelForRecharge(user.id);

    // 创建储值记录
    const record = await RechargeRecord.create({
      user_id: user_id,
      amount: amount,
      bonus_amount: bonus_amount,
      total_amount: total_amount,
      recharge_type: 'wxpay',
      status: 'completed',
      remark: remark || '小程序储值'
    });

    // 创建余额记录
    await createBalanceRecord(
      user_id,
      'recharge',
      total_amount,
      'recharge',
      record.id,
      remark || '储值到账'
    );

    // 重新获取用户信息以获取最新的会员等级
    const updatedUser = await User.findByPk(user_id);

    console.log('储值成功:', {
      user_id,
      amount,
      bonus_amount,
      total_amount,
      new_balance: newBalance.toFixed(2),
      points_added: totalPointsToAdd,
      new_points: updatedUser.points,
      growth_added: growthToAdd,
      new_growth: updatedUser.growth_value,
      old_member_level: user.member_level,
      new_member_level: updatedUser.member_level,
      is_first_recharge: isFirstRecharge
    });

    res.json({
      success: true,
      message: isFirstRecharge ? '恭喜您成为会员！' : '储值成功',
      new_balance: newBalance.toFixed(2),
      total_amount: total_amount,
      bonus_amount: bonus_amount,
      points_added: totalPointsToAdd,
      new_points: updatedUser.points,
      growth_added: growthToAdd,
      new_growth: updatedUser.growth_value,
      old_member_level: user.member_level,
      new_member_level: updatedUser.member_level,
      is_first_recharge: isFirstRecharge,
      record: record
    });
  } catch (error) {
    console.error('简单储值失败:', error);
    res.status(500).json({ success: false, error: '储值失败' });
  }
};

// 充值后自动升级会员等级
const autoUpgradeMemberLevelForRecharge = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    // 获取所有激活的会员等级，按成长值从小到大排序
    const memberLevels = await MemberLevel.findAll({
      where: { is_active: 1 },
      order: [['growth_required', 'ASC']]
    });

    // 找到适合的等级
    let newLevel = 'normal';
    for (const level of memberLevels) {
      if (user.growth_value >= level.growth_required) {
        newLevel = level.level_id;
      } else {
        break;
      }
    }

    // 如果等级有变化，更新会员等级
    if (user.member_level !== newLevel) {
      await user.update({ member_level: newLevel });
      console.log(`✅ 会员 ${user.id} 充值后等级自动升级为 ${newLevel}`);
    }
  } catch (error) {
    console.error('自动升级会员等级失败:', error);
  }
};

// 自定义储值功能（增强版管理员储值）
const customRecharge = async (req, res) => {
  try {
    const { user_id, amount, bonus_amount, remark, recharge_type, direct_set_points, direct_set_growth } = req.body;

    console.log('自定义储值请求:', { user_id, amount, bonus_amount, remark, recharge_type, direct_set_points, direct_set_growth });

    // 验证用户是否存在
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const rechargeAmount = parseFloat(amount) || 0;
    const bonusAmount = parseFloat(bonus_amount) || 0;
    const total_amount = rechargeAmount + bonusAmount;

    // 获取当前积分和成长值
    const currentPoints = parseInt(user.points) || 0;
    const currentGrowth = parseInt(user.growth_value) || 0;
    const oldMemberLevel = user.member_level;

    let pointsAdded = 0;
    let growthAdded = 0;
    let message = '';

    // 判断是否使用直接设置模式
    const isDirectSetMode = direct_set_points !== undefined || direct_set_growth !== undefined;

    if (isDirectSetMode) {
      // 直接设置模式：直接覆盖用户的积分和成长值
      const newPoints = parseInt(direct_set_points) || currentPoints;
      const newGrowth = parseInt(direct_set_growth) || currentGrowth;

      pointsAdded = newPoints - currentPoints;
      growthAdded = newGrowth - currentGrowth;

      // 更新用户积分和成长值
      await user.update({
        points: newPoints,
        growth_value: newGrowth
      });

      message = `积分: ${currentPoints} → ${newPoints}, 成长值: ${currentGrowth} → ${newGrowth}`;

      console.log('自定义储值（直接设置模式）:', {
        user_id,
        oldPoints: currentPoints,
        newPoints,
        pointsAdded,
        oldGrowth: currentGrowth,
        newGrowth,
        growthAdded
      });
    } else {
      // 正常充值模式：按照金额计算积分和成长值
      if (rechargeAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: '充值金额必须大于0'
        });
      }

      // 新会员规则：
      // 1. 充值金额转换为积分（1元=1积分）
      // 2. 积分全部转换为成长值（1积分=1成长值）
      pointsAdded = Math.floor(rechargeAmount);
      growthAdded = pointsAdded;

      const newPoints = currentPoints + pointsAdded;
      const newGrowth = currentGrowth + growthAdded;

      // 更新用户积分和成长值
      await user.update({
        points: newPoints,
        growth_value: newGrowth
      });

      message = `获得积分 ${pointsAdded}, 成长值 ${growthAdded}`;

      console.log('自定义储值（正常充值模式）:', {
        user_id,
        rechargeAmount,
        pointsAdded,
        growthAdded,
        currentPoints,
        newPoints,
        currentGrowth,
        newGrowth
      });
    }

    // 更新用户余额（如果有充值金额）
    if (total_amount > 0) {
      await user.update({
        balance: (parseFloat(user.balance) + total_amount).toFixed(2)
      });
    }

    // 根据成长值自动升级会员等级
    await autoUpgradeMemberLevelForRecharge(user.id);

    // 创建储值记录
    const record = await RechargeRecord.create({
      user_id,
      amount: rechargeAmount,
      bonus_amount: bonusAmount,
      total_amount: total_amount,
      recharge_type: recharge_type || 'admin',
      status: 'completed',
      remark: remark || (isDirectSetMode ? '自定义储值（直接设置）' : '自定义储值')
    });

    // 创建余额记录
    if (total_amount > 0) {
      await createBalanceRecord(
        user_id,
        'recharge',
        total_amount,
        'recharge',
        record.id,
        remark || '自定义储值'
      );
    }

    // 重新获取用户信息以获取最新的会员等级
    const updatedUser = await User.findByPk(user_id);

    console.log('自定义储值成功:', {
      user_id,
      amount: rechargeAmount,
      bonus_amount: bonusAmount,
      total_amount: total_amount > 0 ? total_amount : undefined,
      new_balance: total_amount > 0 ? updatedUser.balance : undefined,
      points_added: pointsAdded,
      new_points: updatedUser.points,
      growth_added: growthAdded,
      new_growth: updatedUser.growth_value,
      old_member_level: oldMemberLevel,
      new_member_level: updatedUser.member_level
    });

    const response = {
      success: true,
      message: message,
      record,
      is_direct_set: isDirectSetMode
    };

    // 只在有余额变化时返回余额信息
    if (total_amount > 0) {
      response.new_balance = updatedUser.balance;
    }

    response.points_added = pointsAdded;
    response.new_points = updatedUser.points;
    response.growth_added = growthAdded;
    response.new_growth = updatedUser.growth_value;
    response.old_member_level = oldMemberLevel;
    response.new_member_level = updatedUser.member_level;

    res.json(response);
  } catch (error) {
    console.error('自定义储值失败:', error);
    res.status(500).json({ success: false, error: '自定义储值失败: ' + error.message });
  }
};

module.exports = {
  getRechargePlans,
  addRechargePlan,
  updateRechargePlan,
  deleteRechargePlan,
  toggleRechargePlanStatus,
  getRechargeRecords,
  getUserRechargeRecords,
  adminRecharge,
  customRecharge,
  createRechargeOrder,
  confirmPayment,
  simpleRecharge,
  autoUpgradeMemberLevelForRecharge
};
