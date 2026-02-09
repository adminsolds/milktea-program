const { Activity, UserActivity, User } = require('../models');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;

// 获取活动列表
const getActivities = async (req, res) => {
  try {
    const { userId } = req.query;

    // 查询所有激活的活动
    const activities = await Activity.findAll({
      where: { is_active: 1 },
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    // 为每个活动添加用户参与状态
    const activitiesWithStatus = await Promise.all(
      activities.map(async activity => {
        let userActivity = null;
        let hasParticipated = false;
        let canReceive = true;

        if (userId) {
          userActivity = await UserActivity.findOne({
            where: {
              user_id: userId,
              activity_id: activity.id
            }
          });

          hasParticipated = !!userActivity;

          // 检查是否可以领取
          if (activity.type === 'birthday') {
            const user = await User.findByPk(userId);
            if (user) {
              const today = new Date();
              const userBirthday = new Date(user.birthday);
              const isBirthday = userBirthday.getMonth() === today.getMonth() && 
                               userBirthday.getDate() === today.getDate();
              canReceive = isBirthday && !hasParticipated;
            }
          } else if (activity.type === 'member-day') {
            const user = await User.findByPk(userId);
            if (user) {
              const today = new Date();
              const memberDay = new Date(user.member_day);
              const isMemberDay = memberDay.getMonth() === today.getMonth() && 
                                   memberDay.getDate() === today.getDate();
              canReceive = isMemberDay && !hasParticipated;
            }
          } else {
            canReceive = !hasParticipated;
          }
        }

        return {
          ...activity.dataValues,
          hasParticipated,
          canReceive
        };
      })
    );

    res.json(activitiesWithStatus);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 参与抽奖
const participateLottery = async (req, res) => {
  try {
    const { userId } = req.params;
    const { activityId } = req.params;

    // 检查活动是否存在
    const activity = await Activity.findByPk(activityId);
    if (!activity || activity.type !== 'lottery' || !activity.is_active) {
      return res.status(400).json({ error: 'Invalid activity' });
    }

    // 检查用户是否已经参与
    const existing = await UserActivity.findOne({
      where: {
        user_id: userId,
        activity_id: activityId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already participated' });
    }

    // 检查抽奖次数限制
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await UserActivity.count({
      where: {
        user_id: userId,
        activity_id: activityId,
        created_at: { [Op.gte]: today }
      }
    });

    if (todayCount >= activity.daily_limit) {
      return res.status(400).json({ error: 'Daily limit exceeded' });
    }

    // 创建参与记录
    await UserActivity.create({
      user_id: userId,
      activity_id: activityId
    });

    // 执行抽奖逻辑（简化版）
    const prizes = activity.prizes || [];
    const wonPrize = prizes[Math.floor(Math.random() * prizes.length)];

    res.json({
      success: true,
      prize: wonPrize || null
    });
  } catch (error) {
    console.error('Participate lottery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 领取生日福利
const receiveBirthdayWelfare = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date();
    const userBirthday = new Date(user.birthday);
    const isBirthday = userBirthday.getMonth() === today.getMonth() && 
                     userBirthday.getDate() === today.getDate();

    if (!isBirthday) {
      return res.status(400).json({ error: 'Not your birthday' });
    }

    const activity = await Activity.findOne({
      where: { type: 'birthday', is_active: 1 }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const existing = await UserActivity.findOne({
      where: {
        user_id: userId,
        activity_id: activity.id
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already received' });
    }

    await UserActivity.create({
      user_id: userId,
      activity_id: activity.id
    });

    res.json({
      success: true,
      reward: activity.reward
    });
  } catch (error) {
    console.error('Receive birthday welfare error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 检查会员日
const checkMemberDay = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const today = new Date();
    const memberDay = new Date(user.member_day);
    const isMemberDay = memberDay.getMonth() === today.getMonth() && 
                         memberDay.getDate() === today.getDate();

    const activity = await Activity.findOne({
      where: { type: 'member-day', is_active: 1 }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const existing = await UserActivity.findOne({
      where: {
        user_id: userId,
        activity_id: activity.id
      }
    });

    res.json({
      isMemberDay,
      hasReceived: !!existing,
      reward: activity.reward
    });
  } catch (error) {
    console.error('Check member day error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getActivities,
  participateLottery,
  receiveBirthdayWelfare,
  checkMemberDay
};
