const { User, BalanceRecord } = require('../models');

/**
 * 创建余额记录
 * @param {number} userId - 用户ID
 * @param {string} type - 类型：recharge-充值, consume-消费, refund-退款, adjust-调整
 * @param {number} amount - 金额（正数为增加，负数为减少）
 * @param {string} sourceType - 来源类型：recharge-储值, order-订单, admin-管理员操作, system-系统
 * @param {number} sourceId - 来源ID
 * @param {string} description - 描述
 */
const createBalanceRecord = async (userId, type, amount, sourceType, sourceId = null, description = '') => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      console.error('创建余额记录失败：用户不存在', userId);
      return null;
    }

    const balanceBefore = parseFloat(user.balance) || 0;
    const balanceAfter = balanceBefore + parseFloat(amount);

    // 确保余额不会变成负数（除了调整类型的记录）
    if (type !== 'adjust' && type !== 'refund' && balanceAfter < 0) {
      console.error('创建余额记录失败：余额不足', { userId, balanceBefore, amount, balanceAfter });
      return null;
    }

    const record = await BalanceRecord.create({
      user_id: userId,
      type,
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      source_type: sourceType,
      source_id: sourceId,
      description
    });

    // 更新用户余额
    await user.update({ balance: balanceAfter.toFixed(2) });

    console.log('✅ 余额记录创建成功:', {
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      recordId: record.id
    });

    return record;
  } catch (error) {
    console.error('创建余额记录失败:', error);
    return null;
  }
};

/**
 * 获取用户余额记录
 */
const getUserBalanceRecords = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = { user_id: userId };
    if (type && type !== 'all') {
      where.type = type;
    }

    const { count, rows } = await BalanceRecord.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      records: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('获取用户余额记录失败:', error);
    res.status(500).json({ success: false, error: '获取余额记录失败' });
  }
};

/**
 * 获取所有余额记录（管理员）
 */
const getAllBalanceRecords = async (req, res) => {
  try {
    const { type, userId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (type && type !== 'all') {
      where.type = type;
    }
    if (userId) {
      where.user_id = userId;
    }

    const { count, rows } = await BalanceRecord.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'nickName', 'phone'],
        as: 'user'
      }],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      records: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('获取余额记录失败:', error);
    res.status(500).json({ success: false, error: '获取余额记录失败' });
  }
};

module.exports = {
  createBalanceRecord,
  getUserBalanceRecords,
  getAllBalanceRecords
};
