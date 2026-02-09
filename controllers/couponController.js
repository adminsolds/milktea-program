const { Coupon, UserCoupon } = require('../models');

// 获取优惠券列表
const getCoupons = async (req, res) => {
  try {
    const { is_active, is_system, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (is_active !== undefined) where.is_active = is_active;
    if (is_system !== undefined) where.is_system = is_system;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Coupon.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });
    
    // 将 DECIMAL 类型转换为数字
    const coupons = rows.map(coupon => ({
      ...coupon.toJSON(),
      amount: parseFloat(coupon.amount),
      min_amount: parseFloat(coupon.min_amount)
    }));
    
    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      coupons
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取优惠券详情
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const coupon = await Coupon.findByPk(id);
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    // 将 DECIMAL 类型转换为数字
    const couponData = {
      ...coupon.toJSON(),
      amount: parseFloat(coupon.amount),
      min_amount: parseFloat(coupon.min_amount)
    };
    
    res.json(couponData);
  } catch (error) {
    console.error('Get coupon by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建优惠券
const createCoupon = async (req, res) => {
  try {
    const { title, desc, amount, type, min_amount, start_time, end_time, is_system } = req.body;
    
    // 验证必填字段
    if (!title || !amount || !type || !start_time || !end_time) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    
    const coupon = await Coupon.create({
      title,
      desc,
      amount,
      type,
      min_amount,
      start_time,
      end_time,
      is_system: is_system || 0
    });
    
    res.status(201).json(coupon);
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新优惠券
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, desc, amount, type, min_amount, start_time, end_time, is_system, is_active } = req.body;
    
    const coupon = await Coupon.findByPk(id);
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    await coupon.update({
      title: title || coupon.title,
      desc: desc || coupon.desc,
      amount: amount || coupon.amount,
      type: type || coupon.type,
      min_amount: min_amount || coupon.min_amount,
      start_time: start_time || coupon.start_time,
      end_time: end_time || coupon.end_time,
      is_system: is_system !== undefined ? is_system : coupon.is_system,
      is_active: is_active !== undefined ? is_active : coupon.is_active
    });
    
    res.json(coupon);
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除优惠券
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    
    const coupon = await Coupon.findByPk(id);
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    await coupon.destroy();
    
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取用户优惠券
const getUserCoupons = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_used, page = 1, limit = 10 } = req.query;
    
    const where = { user_id: userId };
    if (is_used !== undefined) where.is_used = is_used;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await UserCoupon.findAndCountAll({
      where,
      include: [
        {
          model: Coupon,
          as: 'coupon'
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['obtained_time', 'DESC']]
    });
    
    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      coupons: rows
    });
  } catch (error) {
    console.error('Get user coupons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 给用户发放优惠券
const grantCouponToUser = async (req, res) => {
  try {
    const { userId, couponId } = req.params;
    
    // 检查优惠券是否存在
    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    // 检查用户是否已经拥有该优惠券
    const existingCoupon = await UserCoupon.findOne({
      where: {
        user_id: userId,
        coupon_id: couponId
      }
    });
    
    if (existingCoupon) {
      return res.status(400).json({ error: 'User already has this coupon' });
    }
    
    // 发放优惠券
    const userCoupon = await UserCoupon.create({
      user_id: userId,
      coupon_id: couponId
    });
    
    res.status(201).json(userCoupon);
  } catch (error) {
    console.error('Grant coupon to user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getUserCoupons,
  grantCouponToUser
};