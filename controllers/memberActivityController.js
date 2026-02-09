const { MemberActivity, MemberActivityLog, User, UserCoupon, Coupon, sequelize } = require('../models');
const { Op } = require('sequelize');

// 获取活动列表
const getActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10, type = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (type) where.type = type;
    if (status !== '') where.status = parseInt(status);

    const { count, rows } = await MemberActivity.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json({ success: false, message: '获取活动列表失败', error: error.message });
  }
};

// 获取活动详情
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await MemberActivity.findByPk(id);

    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('获取活动详情失败:', error);
    res.status(500).json({ success: false, message: '获取活动详情失败', error: error.message });
  }
};

// 创建活动
const createActivity = async (req, res) => {
  try {
    const activityData = req.body;
    
    // 验证必填字段
    if (!activityData.name || !activityData.type || !activityData.start_time || !activityData.end_time) {
      return res.status(400).json({ success: false, message: '请填写完整的活动信息' });
    }

    const activity = await MemberActivity.create(activityData);
    res.json({ success: true, message: '活动创建成功', data: activity });
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ success: false, message: '创建活动失败', error: error.message });
  }
};

// 更新活动
const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const activity = await MemberActivity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    await activity.update(updateData);
    res.json({ success: true, message: '活动更新成功', data: activity });
  } catch (error) {
    console.error('更新活动失败:', error);
    res.status(500).json({ success: false, message: '更新活动失败', error: error.message });
  }
};

// 删除活动
const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await MemberActivity.findByPk(id);

    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    await activity.destroy();
    res.json({ success: true, message: '活动删除成功' });
  } catch (error) {
    console.error('删除活动失败:', error);
    res.status(500).json({ success: false, message: '删除活动失败', error: error.message });
  }
};

// 获取进行中的活动（小程序端）
const getActiveActivities = async (req, res) => {
  try {
    const { type = '' } = req.query;
    const now = new Date();

    const where = {
      status: 1,
      start_time: { [Op.lte]: now },
      end_time: { [Op.gte]: now }
    };
    if (type) where.type = type;

    const activities = await MemberActivity.findAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json({ success: false, message: '获取活动列表失败', error: error.message });
  }
};

// 参与抽奖活动
const participateLottery = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { activityId } = req.params;
    const userId = req.user.id;

    // 获取活动信息
    const activity = await MemberActivity.findByPk(activityId, { transaction });
    if (!activity || activity.status !== 1) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: '活动不存在或已结束' });
    }

    // 检查活动时间
    const now = new Date();
    if (now < activity.start_time || now > activity.end_time) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: '活动不在有效期内' });
    }

    // 检查参与次数限制
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayParticipationCount = await MemberActivityLog.count({
      where: {
        user_id: userId,
        activity_id: activityId,
        created_at: { [Op.gte]: today }
      },
      transaction
    });

    if (todayParticipationCount >= activity.daily_limit) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: '今日抽奖次数已用完' });
    }

    // 获取抽奖配置
    const config = activity.config || {};
    const prizes = config.prizes || [];
    
    if (prizes.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: '活动配置错误' });
    }

    // 计算中奖结果
    const random = Math.random() * 100;
    let cumulativeProbability = 0;
    let winningPrize = null;

    for (const prize of prizes) {
      cumulativeProbability += prize.probability;
      if (random <= cumulativeProbability) {
        winningPrize = prize;
        break;
      }
    }

    // 如果没有中奖，给一个默认的"谢谢参与"
    if (!winningPrize) {
      winningPrize = { type: 'none', name: '谢谢参与', probability: 100 };
    }

    // 发放奖励
    let rewardResult = null;
    if (winningPrize.type === 'points') {
      // 发放积分
      const user = await User.findByPk(userId, { transaction });
      await user.update({
        points: (user.points || 0) + winningPrize.value
      }, { transaction });
      rewardResult = { type: 'points', value: winningPrize.value };
    } else if (winningPrize.type === 'coupon') {
      // 发放优惠券
      const coupon = await Coupon.findByPk(winningPrize.coupon_id, { transaction });
      if (coupon) {
        await UserCoupon.create({
          user_id: userId,
          coupon_id: coupon.id,
          obtained_time: new Date()
        }, { transaction });
        rewardResult = { type: 'coupon', coupon_id: coupon.id, name: coupon.name };
      }
    }

    // 记录活动参与日志
    await MemberActivityLog.create({
      user_id: userId,
      activity_id: activityId,
      activity_type: activity.type,
      action: 'lottery',
      result: { prize: winningPrize },
      reward_type: winningPrize.type,
      reward_value: rewardResult,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: '抽奖成功',
      data: {
        prize: winningPrize,
        reward: rewardResult
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('抽奖失败:', error);
    res.status(500).json({ success: false, message: '抽奖失败', error: error.message });
  }
};

// 领取生日福利
const receiveBirthdayBenefit = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, { transaction });

    // 检查今天是否是用户生日
    const today = new Date();
    const birthDate = user.birthday ? new Date(user.birthday) : null;
    
    if (!birthDate || 
        today.getMonth() !== birthDate.getMonth() || 
        today.getDate() !== birthDate.getDate()) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: '今天不是您的生日' });
    }

    // 检查今天是否已经领取过
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const existingLog = await MemberActivityLog.findOne({
      where: {
        user_id: userId,
        activity_type: 'birthday',
        action: 'receive',
        created_at: { [Op.gte]: todayStart }
      },
      transaction
    });

    if (existingLog) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: '今日生日福利已领取' });
    }

    // 获取生日活动配置
    const birthdayActivity = await MemberActivity.findOne({
      where: {
        type: 'birthday',
        status: 1,
        start_time: { [Op.lte]: today },
        end_time: { [Op.gte]: today }
      },
      transaction
    });

    if (!birthdayActivity) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: '暂无生日福利活动' });
    }

    const config = birthdayActivity.config || {};
    const rewards = [];

    // 发放双倍积分奖励
    if (config.double_points) {
      rewards.push({ type: 'points', description: '生日双倍积分权益' });
    }

    // 发放生日优惠券
    if (config.coupon_id) {
      const coupon = await Coupon.findByPk(config.coupon_id, { transaction });
      if (coupon) {
        await UserCoupon.create({
          user_id: userId,
          coupon_id: coupon.id,
          obtained_time: new Date()
        }, { transaction });
        rewards.push({ type: 'coupon', coupon_id: coupon.id, name: coupon.name });
      }
    }

    // 发放生日积分
    if (config.points) {
      await user.update({
        points: (user.points || 0) + config.points
      }, { transaction });
      rewards.push({ type: 'points', value: config.points });
    }

    // 记录日志
    await MemberActivityLog.create({
      user_id: userId,
      activity_id: birthdayActivity.id,
      activity_type: 'birthday',
      action: 'receive',
      result: { rewards },
      reward_type: rewards.length > 0 ? 'multiple' : 'none',
      reward_value: rewards,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: '生日福利领取成功',
      data: { rewards }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('领取生日福利失败:', error);
    res.status(500).json({ success: false, message: '领取失败', error: error.message });
  }
};

// 检查会员日活动
const checkMemberDayActivity = async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日, 1=周一, ..., 6=周六

    // 查找今天的会员日活动
    const activity = await MemberActivity.findOne({
      where: {
        type: 'member_day',
        status: 1,
        start_time: { [Op.lte]: today },
        end_time: { [Op.gte]: today }
      }
    });

    if (!activity) {
      return res.json({ success: true, isMemberDay: false, message: '今天不是会员日' });
    }

    const config = activity.config || {};
    
    // 检查今天是否是配置的会员日
    const memberDays = config.days || []; // [1, 3, 5] 表示周一、三、五
    if (!memberDays.includes(dayOfWeek)) {
      return res.json({ success: true, isMemberDay: false, message: '今天不是会员日' });
    }

    res.json({
      success: true,
      isMemberDay: true,
      activity: {
        id: activity.id,
        name: activity.name,
        description: activity.description,
        discount: config.discount || 0,
        double_points: config.double_points || false,
        special_offers: config.special_offers || []
      }
    });
  } catch (error) {
    console.error('检查会员日失败:', error);
    res.status(500).json({ success: false, message: '检查失败', error: error.message });
  }
};

// 获取新品立减活动
const getNewProductActivities = async (req, res) => {
  try {
    const today = new Date();
    
    const activities = await MemberActivity.findAll({
      where: {
        type: 'new_product',
        status: 1,
        start_time: { [Op.lte]: today },
        end_time: { [Op.gte]: today }
      },
      order: [['sort_order', 'ASC']]
    });

    // 格式化返回数据
    const formattedActivities = activities.map(activity => {
      const config = activity.config || {};
      return {
        id: activity.id,
        name: activity.name,
        description: activity.description,
        products: config.products || [],
        discount: config.discount || 0,
        double_points: config.double_points || false,
        start_time: activity.start_time,
        end_time: activity.end_time
      };
    });

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('获取新品立减活动失败:', error);
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
};

// 获取限时抢购活动
const getFlashSaleActivities = async (req, res) => {
  try {
    const today = new Date();
    
    const activities = await MemberActivity.findAll({
      where: {
        type: 'flash_sale',
        status: 1,
        start_time: { [Op.lte]: today },
        end_time: { [Op.gte]: today }
      },
      order: [['sort_order', 'ASC']]
    });

    // 格式化返回数据
    const formattedActivities = activities.map(activity => {
      const config = activity.config || {};
      return {
        id: activity.id,
        name: activity.name,
        description: activity.description,
        product: {
          id: config.product_id,
          name: config.product_name,
          original_price: config.original_price,
          sale_price: config.sale_price
        },
        limit: config.limit,
        start_time: activity.start_time,
        end_time: activity.end_time
      };
    });

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('获取限时抢购活动失败:', error);
    res.status(500).json({ success: false, message: '获取失败', error: error.message });
  }
};

// 获取用户活动参与记录
const getUserActivityLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await MemberActivityLog.findAndCountAll({
      where: { user_id: userId },
      include: [{
        model: MemberActivity,
        as: 'activity',
        attributes: ['name', 'type']
      }],
      order: [['created_at', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('获取活动记录失败:', error);
    res.status(500).json({ success: false, message: '获取记录失败', error: error.message });
  }
};

module.exports = {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActiveActivities,
  participateLottery,
  receiveBirthdayBenefit,
  checkMemberDayActivity,
  getNewProductActivities,
  getFlashSaleActivities,
  getUserActivityLogs
};
