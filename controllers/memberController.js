const { User, MemberLevel, UserCoupon } = require('../models');
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;

// 获取会员列表
const getMembers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', level = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (search) {
      where[Op.or] = [
        { nickname: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    if (level) {
      where.member_level = level;
    }
    
    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    // 获取所有会员等级，用于显示等级名称
    const memberLevels = await MemberLevel.findAll();
    const levelMap = {};
    memberLevels.forEach(level => {
      levelMap[level.level_id] = level;
    });

    // 获取所有会员的优惠券数量
    const userIds = rows.map(member => member.id);
    const couponCounts = await UserCoupon.findAll({
      where: {
        user_id: { [Op.in]: userIds },
        is_used: 0  // 未使用的优惠券
      },
      attributes: ['user_id', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['user_id']
    });

    // 构建优惠券数量映射
    const couponCountMap = {};
    couponCounts.forEach(item => {
      couponCountMap[item.user_id] = parseInt(item.get('count'));
    });

    // 补充会员等级信息并统一字段名
    const membersWithLevelInfo = rows.map(member => {
      const memberData = member.toJSON();
      memberData.level_info = levelMap[memberData.member_level] || {
        name: '普通会员',
        icon: '',
        color: '#999'
      };
      // 统一头像字段名为avatarUrl，与用户管理API保持一致
      memberData.avatarUrl = memberData.avatar;
      // 添加优惠券数量
      memberData.couponCount = couponCountMap[memberData.id] || 0;
      return memberData;
    });
    
    res.json({
      success: true,
      data: membersWithLevelInfo,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('获取会员列表失败:', error);
    res.status(500).json({ success: false, message: '获取会员列表失败', error: error.message });
  }
};

// 手动创建会员
const createMember = async (req, res) => {
  try {
    const { nickname, phone, member_level, growth_value, points, balance, avatar, is_active } = req.body;

    // 验证必填字段
    if (!nickname || !phone) {
      return res.status(400).json({ success: false, message: '昵称和手机号为必填项' });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: '手机号格式不正确' });
    }

    // 检查手机号是否已存在
    const existingMember = await User.findOne({ where: { phone } });
    if (existingMember) {
      return res.status(400).json({ success: false, message: '该手机号已注册' });
    }

    // 验证会员等级是否存在（如果提供）
    if (member_level) {
      const levelExists = await MemberLevel.findOne({ where: { level_id: member_level } });
      if (!levelExists) {
        return res.status(400).json({ success: false, message: '指定的会员等级不存在' });
      }
    }

    // 生成会员编号（格式：M + 年月日 + 4位随机数）
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
                    (today.getMonth() + 1).toString().padStart(2, '0') +
                    today.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const memberNo = `M${dateStr}${randomNum}`;

    // 为手动创建的会员生成一个虚拟 openid（格式：manual_手机号）
    const manualOpenid = `manual_${phone}_${Date.now()}`;

    // 创建新会员
    const newMember = await User.create({
      nickname,
      phone,
      openid: manualOpenid,  // 手动创建的会员需要提供 openid
      member_level: member_level || 'normal',  // 使用默认值 'normal'
      member_no: memberNo,
      growth_value: growth_value || 0,
      points: points || 0,
      balance: balance || 0,
      avatar: avatar || null,
      is_active: is_active !== undefined ? is_active : 1
    });

    // 获取会员等级信息
    const memberLevel = await MemberLevel.findOne({ where: { level_id: newMember.member_level } });
    const memberData = newMember.toJSON();
    memberData.level_info = memberLevel || {
      name: '普通会员',
      icon: '',
      color: '#999'
    };
    // 统一头像字段名为avatarUrl
    memberData.avatarUrl = memberData.avatar;

    res.status(201).json({
      success: true,
      message: '会员创建成功',
      data: memberData
    });
  } catch (error) {
    console.error('创建会员失败:', error);
    res.status(500).json({ success: false, message: '创建会员失败', error: error.message });
  }
};

// 根据ID获取会员
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await User.findByPk(id);
    
    if (!member) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }
    
    // 获取会员等级信息
    const memberLevel = await MemberLevel.findOne({ where: { level_id: member.member_level } });
    const memberData = member.toJSON();
    memberData.level_info = memberLevel || {
      name: '普通会员',
      icon: '',
      color: '#999'
    };
    // 统一头像字段名为avatarUrl，与用户管理API保持一致
    memberData.avatarUrl = memberData.avatar;
    
    res.json({ success: true, data: memberData });
  } catch (error) {
    console.error('获取会员详情失败:', error);
    res.status(500).json({ success: false, message: '获取会员详情失败', error: error.message });
  }
};

// 更新会员信息
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, phone, avatar, avatarUrl, member_level, growth_value, points, balance, is_active } = req.body;

    const member = await User.findByPk(id);
    if (!member) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }

    // 支持前端字段名 avatarUrl 和后端字段名 avatar
    const finalAvatar = avatarUrl || avatar;

    // 更新会员信息
    await member.update({
      nickname,
      phone,
      avatar: finalAvatar,
      member_level,
      growth_value,
      points,
      balance,
      is_active
    });

    // 更新后检查是否需要自动升级
    await autoUpgradeMemberLevel(member.id);

    const updatedMember = await User.findByPk(id);
    const memberData = updatedMember.toJSON();

    // 统一返回格式，包含 avatarUrl 字段
    memberData.avatarUrl = memberData.avatar;

    // 获取会员等级信息
    const memberLevel = await MemberLevel.findOne({ where: { level_id: memberData.member_level } });
    memberData.level_info = memberLevel || {
      name: '普通会员',
      icon: '',
      color: '#999'
    };

    res.json({ success: true, message: '会员信息更新成功', data: memberData });
  } catch (error) {
    console.error('更新会员信息失败:', error);
    res.status(500).json({ success: false, message: '更新会员信息失败', error: error.message });
  }
};

// 删除会员
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await User.findByPk(id);
    
    if (!member) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }
    
    await member.destroy();
    res.json({ success: true, message: '会员删除成功' });
  } catch (error) {
    console.error('删除会员失败:', error);
    res.status(500).json({ success: false, message: '删除会员失败', error: error.message });
  }
};

// 会员等级自动升级
const autoUpgradeMemberLevel = async (userId) => {
  try {
    const member = await User.findByPk(userId);
    if (!member) return;
    
    // 获取所有激活的会员等级，按成长值从小到大排序
    const memberLevels = await MemberLevel.findAll({
      where: { is_active: 1 },
      order: [['growth_required', 'ASC']]
    });
    
    // 找到适合的等级
    let newLevel = 'normal';
    for (const level of memberLevels) {
      if (member.growth_value >= level.growth_required) {
        newLevel = level.level_id;
      } else {
        break;
      }
    }
    
    // 如果等级有变化，更新会员等级
    if (member.member_level !== newLevel) {
      await member.update({ member_level: newLevel });
      console.log(`会员 ${member.id} 等级自动升级为 ${newLevel}`);
    }
  } catch (error) {
    console.error('自动升级会员等级失败:', error);
  }
};

// 更新会员成长值
const updateMemberGrowth = async (req, res) => {
  try {
    const { id } = req.params;
    const { growth_value } = req.body;
    
    const member = await User.findByPk(id);
    if (!member) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }
    
    // 更新成长值
    await member.update({ growth_value });
    
    // 自动升级
    await autoUpgradeMemberLevel(member.id);
    
    const updatedMember = await User.findByPk(id);
    res.json({ success: true, message: '成长值更新成功', data: updatedMember });
  } catch (error) {
    console.error('更新会员成长值失败:', error);
    res.status(500).json({ success: false, message: '更新会员成长值失败', error: error.message });
  }
};

// 搜索会员
const searchMembers = async (req, res) => {
  try {
    const { keyword } = req.query;

    const members = await User.findAll({
      where: {
        [Op.or]: [
          { nickname: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } }
        ]
      },
      limit: 20
    });

    res.json({ success: true, data: members });
  } catch (error) {
    console.error('搜索会员失败:', error);
    res.status(500).json({ success: false, message: '搜索会员失败', error: error.message });
  }
};

// 根据手机号获取会员（用于POS现场点单）
const getMemberByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    // 查找用户
    const user = await User.findOne({
      where: { phone }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }

    // 获取会员等级信息
    const memberLevel = await MemberLevel.findOne({ where: { level_id: user.member_level } });

    const memberData = user.toJSON();
    memberData.level_info = memberLevel || {
      level_id: 'normal',
      name: '普通会员',
      discount: 100,  // 100表示无折扣
      icon: '',
      color: '#999'
    };

    // 将折扣转换为0-1之间的小数（如90转为0.9）
    const discountRate = memberData.level_info.discount ? (memberData.level_info.discount / 100) : 1.0;

    // 返回数据，包含会员折扣信息和余额
    res.json({
      success: true,
      member: {
        id: memberData.id,
        user_id: memberData.id,
        nickname: memberData.nickname,
        phone: memberData.phone,
        member_level: memberData.member_level,
        discount: discountRate,  // 返回0-1之间的小数
        level_name: memberData.level_info.name,
        balance: memberData.balance || 0  // 添加余额字段
      }
    });
  } catch (error) {
    console.error('根据手机号获取会员失败:', error);
    res.status(500).json({ success: false, message: '获取会员信息失败', error: error.message });
  }
};

module.exports = {
  getMembers,
  createMember,
  getMemberById,
  updateMember,
  deleteMember,
  autoUpgradeMemberLevel,
  updateMemberGrowth,
  searchMembers,
  getMemberByPhone
};
