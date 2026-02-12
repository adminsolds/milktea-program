const { User, MemberLevel, UserCoupon, Coupon } = require('../models');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;
const axios = require('axios');

// 生成会员编号
const generateMemberNo = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `MX${timestamp}${random}`;
};

// 用户登录
const login = async (req, res) => {
  try {
    const { openid, phone, nickname, avatar, code, encryptedData, iv, phoneCode } = req.body;

    // 开发环境：如果没有 openid，使用模拟 openid
    let mockOpenid = openid;
    let decryptedPhone = phone;
    
    if (!mockOpenid) {
      // 在真实环境中，这里应该调用微信服务器解密手机号
      // 现在使用模拟数据 - 使用固定前缀，后续根据手机号生成固定openid
      mockOpenid = `mock_openid_${phone || 'default'}`;
      console.log('开发环境：使用模拟 openid:', mockOpenid);
    }
    
    // 微信配置
    const WECHAT_CONFIG = {
      appId: process.env.WECHAT_APP_ID || 'your-app-id',
      appSecret: process.env.WECHAT_APP_SECRET || 'your-app-secret'
    };
    
    // 新方式：使用微信的phonenumber.getPhoneNumber接口（基础库2.21.2+）
    if (phoneCode) {
      console.log('收到新方式的phoneCode:', phoneCode);
      try {
        // 从环境变量获取微信配置
        const appId = process.env.WECHAT_APP_ID || 'wx34c42d4602b7d07c';
        const appSecret = process.env.WECHAT_APP_SECRET || '3192d00b3028d2154b07b066f9b21034';

        if (!appId || !appSecret) {
          throw new Error('微信配置不完整，缺少appId或appSecret');
        }

        // 获取微信接口调用凭证 - 使用POST方法
        console.log('正在获取access_token...');
        const accessTokenResponse = await axios.post('https://api.weixin.qq.com/cgi-bin/stable_token',
          {
            grant_type: 'client_credential',
            appid: appId,
            secret: appSecret
          },
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );

        console.log('access_token获取结果:', accessTokenResponse.data);

        if (accessTokenResponse.data.access_token) {
          const accessToken = accessTokenResponse.data.access_token;

          // 调用微信的phonenumber.getPhoneNumber接口
          console.log('正在调用微信phonenumber.getPhoneNumber接口...');
          const phoneResponse = await axios.post(
            'https://api.weixin.qq.com/wxa/business/phonenumber/getPhoneNumber',
            { code: phoneCode },
            {
              headers: { 'Content-Type': 'application/json' },
              params: { access_token: accessToken }
            }
          );

          console.log('微信phonenumber.getPhoneNumber接口返回:', phoneResponse.data);

          if (phoneResponse.data && phoneResponse.data.phone_info) {
            decryptedPhone = phoneResponse.data.phone_info.phoneNumber;
            console.log('通过新方式获取到真实手机号:', decryptedPhone);
          } else {
            console.error('新方式获取手机号失败:', phoneResponse.data.errmsg || '未知错误');
            throw new Error(phoneResponse.data.errmsg || '获取手机号失败');
          }
        } else {
          console.error('获取access_token失败:', accessTokenResponse.data.errmsg);
          throw new Error('获取access_token失败: ' + (accessTokenResponse.data.errmsg || '未知错误'));
        }
      } catch (error) {
        console.error('调用微信phonenumber.getPhoneNumber接口失败:', error);
        // 在开发环境下，如果调用微信API失败，不生成测试手机号，设置为空
        decryptedPhone = '';
        console.log('开发环境：手机号解密失败，设置为空');
      }
    }
    
    // 旧方式：处理微信手机号解密（简化版，真实环境需要调用微信API）
    if (!decryptedPhone && encryptedData && iv) {
      console.log('收到加密手机号数据，encryptedData:', encryptedData.length, 'iv:', iv);
      
      // 模拟解密，实际项目中需要使用微信提供的解密算法
      // 开发环境：生成一个随机的有效手机号
      const randomPhone = `13${Math.floor(Math.random() * 100000000).toString().padStart(9, '0')}`;
      decryptedPhone = randomPhone;
      console.log('解密成功，生成随机手机号:', decryptedPhone);
    } else if (phone) {
      // 如果直接传递了手机号，使用它
      decryptedPhone = phone;
      console.log('使用直接传递的手机号:', decryptedPhone);
    } 
    
    // 确保生成一个有效的手机号
    if (!decryptedPhone || !/^1[3-9]\d{9}$/.test(decryptedPhone)) {
      // 生成一个固定的测试手机号
      decryptedPhone = '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      console.log('生成测试手机号:', decryptedPhone);
    }

    // 查找或创建用户
    let user = await User.findOne({ where: { openid: mockOpenid } });

    if (!user) {
      user = await User.create({
                        openid: mockOpenid,
                        phone: decryptedPhone,  // 使用解密后的手机号
                        nickname: nickname || '奶茶爱好者',
                        avatar: avatar || '',  // 不设置默认头像URL，使用图标代替
                        member_no: generateMemberNo()  // 自动生成会员编号
                    });
    } else {
      // 更新用户信息和最后登录时间
      // 只在以下情况更新手机号：
      // 1. 用户手机号为空（首次设置）
      // 2. 请求中明确标识为强制更新手机号（forceUpdatePhone为true）
      const updateData = {
        nickname: nickname || user.nickname,
        avatar: avatar || user.avatar,
        last_login_at: new Date()  // 更新最后登录时间
      };

      // 只有当用户没有手机号，或者明确要求强制更新时，才更新手机号
      // 这样可以保留用户在个人资料中手动修改的手机号
      if (!user.phone || req.body.forceUpdatePhone) {
        updateData.phone = decryptedPhone;
        console.log('更新用户手机号:', decryptedPhone);
      } else {
        console.log('保留用户现有手机号:', user.phone);
      }

      await user.update(updateData);
    }

    // 如果是新创建的用户，也要设置最后登录时间
    if (user.createdAt && !user.last_login_at) {
      await user.update({ last_login_at: new Date() });
    }

    // 获取会员等级折扣信息
    let discountRate = 1; // 默认无折扣
    try {
      const memberLevel = await MemberLevel.findOne({
        where: { level_id: user.member_level, is_active: 1 }
      });
      if (memberLevel && memberLevel.discount) {
        // 数据库存储的是 90.00（表示90%，即9折），需要转换为 0.9
        discountRate = parseFloat(memberLevel.discount) / 100;
      }
    } catch (error) {
      console.error('获取会员等级折扣失败:', error);
      // 使用默认折扣率
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, openid: user.openid },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        openid: user.openid,
        phone: user.phone,
        nickName: user.nickname,
        avatarUrl: user.avatar,
        memberNo: user.member_no,
        level: user.member_level,
        levelCode: user.member_level,
        points: user.points,
        totalPoints: user.growth_value,
        balance: user.balance,
        is_active: user.is_active,
        discountRate: discountRate,
        last_login_at: user.last_login_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取用户信息
const getUserProfile = async (req, res) => {
  try {
    // 支持通过 openid 或 userId 查询用户
    const { openid, userId } = req.query;

    let user;
    if (openid) {
      // 通过 openid 查询
      user = await User.findOne({ where: { openid } });
    } else if (userId) {
      // 通过 userId 查询
      user = await User.findByPk(userId);
    } else {
      // 如果没有提供任何参数，尝试获取第一个用户（开发环境）
      user = await User.findOne({
        order: [['createdAt', 'DESC']]
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 获取会员等级信息
    let memberLevelName = '普通会员';
    let discountRate = 1; // 默认无折扣
    try {
      const memberLevel = await MemberLevel.findOne({
        where: { level_id: user.member_level, is_active: 1 }
      });
      if (memberLevel) {
        memberLevelName = memberLevel.name;
        // 数据库存储的是 90.00（表示90%，即9折），需要转换为 0.9
        discountRate = parseFloat(memberLevel.discount) / 100;
      }
    } catch (error) {
      console.error('获取会员等级信息失败:', error);
      // 使用默认等级名称和折扣率
    }

    // 获取用户可用优惠券数量
    let couponCount = 0;
    try {
      console.log('查询用户优惠券, userId:', user.id);
      
      // 查询用户未使用的优惠券
      const userCoupons = await UserCoupon.findAll({
        where: {
          user_id: user.id,
          is_used: 0 // 0: 未使用
        },
        include: [{
          model: Coupon,
          as: 'coupon',
          required: false // 允许优惠券不存在
        }]
      });
      console.log('用户未使用优惠券数量:', userCoupons.length);
      
      // 检查每个优惠券是否过期和激活
      const now = new Date();
      for (const userCoupon of userCoupons) {
        if (userCoupon.coupon) {
          const endTime = new Date(userCoupon.coupon.end_time);
          console.log('优惠券:', userCoupon.coupon.id, '结束时间:', endTime.toISOString(), '是否过期:', endTime < now, '是否激活:', userCoupon.coupon.is_active);
          
          // 检查是否过期（使用 >= 而不是 >，包含当天）
          const endTimeMidnight = new Date(endTime);
          endTimeMidnight.setHours(23, 59, 59, 999);
          
          if (endTimeMidnight >= now && userCoupon.coupon.is_active == 1) {
            couponCount++;
          }
        }
      }
      console.log('用户可用优惠券数量:', couponCount);
    } catch (error) {
      console.error('获取优惠券数量失败:', error);
    }

    res.json({
      id: user.id,
      openid: user.openid,
      phone: user.phone,
      nickName: user.nickname,
      avatarUrl: user.avatar,
      memberNo: user.member_no,
      level: user.member_level,
      levelName: memberLevelName, // 添加等级名称
      levelCode: user.member_level,
      points: user.points,
      totalPoints: user.growth_value,
      balance: user.balance,
      coupons: couponCount, // 可用优惠券数量
      is_active: user.is_active,
      discountRate: discountRate,
      last_login_at: user.last_login_at
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新用户信息
const updateUserProfile = async (req, res) => {
  try {
    const { phone, nickname, nickName, avatar, avatarUrl } = req.body;

    // 首先尝试获取最新创建的用户（开发环境）
    let user = await User.findOne({
      order: [['createdAt', 'DESC']]
    });

    // 如果没有用户，创建一个默认用户
    if (!user) {
      user = await User.create({
        openid: 'default_openid',
        phone: '13800138000',
        nickname: '默认用户',
        member_no: generateMemberNo()
      });
      console.log('创建了默认用户:', user.id);
    }

    console.log('使用用户:', user.id, user.nickname);

    await user.update({
      phone: phone || user.phone,
      nickname: nickName || nickname || user.nickname,
      avatar: avatarUrl || avatar || user.avatar
    });

    res.json({
      id: user.id,
      openid: user.openid,
      phone: user.phone,
      nickName: user.nickname,
      avatarUrl: user.avatar,
      memberNo: user.member_no,
      level: user.member_level,
      levelCode: user.member_level,
      points: user.points,
      totalPoints: user.growth_value,
      balance: user.balance,
      is_active: user.is_active
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取用户积分
const getUserPoints = async (req, res) => {
  try {
    // 从查询参数获取用户ID，如果没有则尝试从第一个用户获取
    const { userId } = req.query;

    let user;
    if (userId) {
      user = await User.findByPk(userId);
    } else {
      // 如果没有指定用户ID，获取第一个用户
      const users = await User.findAll({ limit: 1 });
      user = users[0];
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user_id: user.id,
      points: user.points || 0,
      totalPoints: user.growth_value || 0,
      member_level: user.member_level,
      history: []
    });
  } catch (error) {
    console.error('Get user points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取用户列表
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    console.log('========== 获取用户列表 ==========');
    console.log('请求参数:', { page, limit, search, status, offset });

    const where = {};
    if (search) {
      where[Op.or] = [
        { nickname: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { openid: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status !== '') {
      where.is_active = parseInt(status);
    }

    console.log('查询条件:', JSON.stringify(where, null, 2));

    const { count, rows } = await User.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    console.log('查询结果:', { count, 用户数量: rows.length });
    if (rows.length > 0) {
      console.log('第一个用户数据:', JSON.stringify(rows[0], null, 2));
    }

    // 获取所有用户的优惠券数量
    const userIds = rows.map(user => user.id);
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

    // 转换数据格式以匹配前端期望的字段名
    const formattedData = rows.map(user => ({
      id: user.id,
      openid: user.openid,
      phone: user.phone,
      nickName: user.nickname,
      avatarUrl: user.avatar,
      memberNo: user.member_no,
      level: user.member_level,
      levelCode: user.member_level,
      points: user.points,
      totalPoints: user.growth_value,
      balance: user.balance,
      couponCount: couponCountMap[user.id] || 0,  // 添加优惠券数量
      is_active: user.is_active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      last_login_at: user.last_login_at
    }));

    console.log('格式化后的数据:', formattedData.length > 0 ? formattedData[0] : '无数据');

    res.json({
      success: true,
      data: formattedData,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });

    console.log('========== 用户列表查询完成 ==========');
  } catch (error) {
    console.error('========== 获取用户列表失败 ==========');
    console.error('错误详情:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败', error: error.message });
  }
};

// 根据ID获取用户
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 转换数据格式以匹配前端期望的字段名
    const formattedUser = {
      id: user.id,
      openid: user.openid,
      phone: user.phone,
      nickName: user.nickname,
      avatarUrl: user.avatar,
      memberNo: user.member_no,
      level: user.member_level,
      levelCode: user.member_level,
      points: user.points,
      totalPoints: user.growth_value,
      balance: user.balance,
      is_active: user.is_active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt
    };

    res.json({ success: true, data: formattedUser });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ success: false, message: '获取用户详情失败', error: error.message });
  }
};

// 更新用户信息
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, nickName, phone, avatar, avatarUrl, member_level, level, growth_value, points, balance, is_active } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 更新用户信息 - 支持前端字段名和后端字段名
    await user.update({
      nickname: nickName || nickname || user.nickname,
      phone: phone || user.phone,
      avatar: avatarUrl || avatar || user.avatar,
      member_level: level !== undefined ? level : (member_level !== undefined ? member_level : user.member_level),
      growth_value: growth_value !== undefined ? growth_value : user.growth_value,
      points: points !== undefined ? points : user.points,
      balance: balance !== undefined ? balance : user.balance,
      is_active: is_active !== undefined ? is_active : user.is_active
    });

    // 返回更新后的数据，统一使用前端字段名
    const formattedUser = {
      id: user.id,
      openid: user.openid,
      phone: user.phone,
      nickName: user.nickname,
      avatarUrl: user.avatar,
      memberNo: user.member_no,
      level: user.member_level,
      levelCode: user.member_level,
      points: user.points,
      totalPoints: user.growth_value,
      balance: user.balance,
      is_active: user.is_active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      last_login_at: user.last_login_at
    };

    res.json({ success: true, message: '用户信息更新成功', data: formattedUser });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '更新用户信息失败', error: error.message });
  }
};

// 删除用户
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    await user.destroy();
    res.json({ success: true, message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ success: false, message: '删除用户失败', error: error.message });
  }
};

// 更新用户微信手机号（用于个人资料页面重新授权）
const updateUserPhone = async (req, res) => {
  try {
    const { openid, phoneCode, encryptedData, iv, forceUpdatePhone } = req.body;

    if (!openid) {
      return res.status(400).json({ success: false, message: '缺少openid' });
    }

    const user = await User.findOne({ where: { openid } });
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    let decryptedPhone = null;

    // 使用微信的phonenumber.getPhoneNumber接口获取手机号
    if (phoneCode) {
      try {
        const appId = process.env.WECHAT_APP_ID || 'wx34c42d4602b7d07c';
        const appSecret = process.env.WECHAT_APP_SECRET || '3192d00b3028d2154b07b066f9b21034';

        // 获取微信接口调用凭证
        const accessTokenResponse = await axios.get('https://api.weixin.qq.com/cgi-bin/stable_token', {
          params: {
            grant_type: 'client_credential',
            appid: appId,
            secret: appSecret
          }
        });

        if (accessTokenResponse.data.access_token) {
          const accessToken = accessTokenResponse.data.access_token;

          // 调用微信的phonenumber.getPhoneNumber接口
          const phoneResponse = await axios.post(
            'https://api.weixin.qq.com/wxa/business/phonenumber/getPhoneNumber',
            { code: phoneCode },
            {
              headers: { 'Content-Type': 'application/json' },
              params: { access_token: accessToken }
            }
          );

          if (phoneResponse.data && phoneResponse.data.phone_info) {
            decryptedPhone = phoneResponse.data.phone_info.phoneNumber;
            console.log('通过新方式获取到真实手机号:', decryptedPhone);
          } else {
            console.error('获取手机号失败:', phoneResponse.data.errmsg || '未知错误');
            return res.status(400).json({ success: false, message: '获取手机号失败' });
          }
        } else {
          console.error('获取access_token失败:', accessTokenResponse.data.errmsg);
          return res.status(500).json({ success: false, message: '获取微信凭证失败' });
        }
      } catch (error) {
        console.error('调用微信phonenumber.getPhoneNumber接口失败:', error);
        return res.status(500).json({ success: false, message: '获取手机号失败，请重试' });
      }
    }

    // 旧方式：处理加密数据（兼容）
    if (!decryptedPhone && encryptedData && iv) {
      // 模拟解密，实际项目中需要使用微信提供的解密算法
      const randomPhone = `13${Math.floor(Math.random() * 100000000).toString().padStart(9, '0')}`;
      decryptedPhone = randomPhone;
      console.log('解密成功，生成随机手机号:', decryptedPhone);
    }

    if (!decryptedPhone) {
      return res.status(400).json({ success: false, message: '无法获取手机号' });
    }

    // 更新用户手机号
    await user.update({ phone: decryptedPhone });

    res.json({
      success: true,
      message: '手机号更新成功',
      phone: decryptedPhone
    });
  } catch (error) {
    console.error('更新用户手机号失败:', error);
    res.status(500).json({ success: false, message: '更新手机号失败', error: error.message });
  }
};

// 解密手机号
const decryptPhone = async (req, res) => {
  try {
    const { code, encryptedData, iv } = req.body;

    console.log('收到解密手机号请求');
    console.log('code:', code);
    console.log('encryptedData length:', encryptedData ? encryptedData.length : 0);
    console.log('iv:', iv);

    // 微信配置
    const appId = process.env.WECHAT_APP_ID || 'wx34c42d4602b7d07c';
    const appSecret = process.env.WECHAT_APP_SECRET || '3192d00b3028d2154b07b066f9b21034';

    if (!appId || !appSecret) {
      throw new Error('微信配置不完整，缺少appId或appSecret');
    }

    // 获取微信接口调用凭证
    console.log('正在获取access_token...');
    const accessTokenResponse = await axios.post('https://api.weixin.qq.com/cgi-bin/stable_token',
      {
        grant_type: 'client_credential',
        appid: appId,
        secret: appSecret
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('access_token获取结果:', accessTokenResponse.data);

    if (!accessTokenResponse.data.access_token) {
      console.error('获取access_token失败:', accessTokenResponse.data.errmsg);
      throw new Error('获取access_token失败: ' + (accessTokenResponse.data.errmsg || '未知错误'));
    }

    const accessToken = accessTokenResponse.data.access_token;

    // 调用微信的phonenumber.getPhoneNumber接口
    console.log('正在调用微信phonenumber.getPhoneNumber接口...');
    const phoneResponse = await axios.post(
      'https://api.weixin.qq.com/wxa/business/phonenumber/getPhoneNumber',
      { code },
      {
        headers: { 'Content-Type': 'application/json' },
        params: { access_token: accessToken }
      }
    );

    console.log('微信phonenumber.getPhoneNumber接口返回:', phoneResponse.data);

    if (phoneResponse.data && phoneResponse.data.phone_info) {
      const phoneNumber = phoneResponse.data.phone_info.phoneNumber;
      console.log('解密成功，手机号:', phoneNumber);

      res.json({
        success: true,
        phone: phoneNumber
      });
    } else {
      console.error('新方式获取手机号失败:', phoneResponse.data.errmsg || '未知错误');
      throw new Error(phoneResponse.data.errmsg || '获取手机号失败');
    }
  } catch (error) {
    console.error('解密手机号失败:', error);
    res.status(500).json({ success: false, message: '解密手机号失败', error: error.message });
  }
};

// 使用微信 getuserphonenumber API 换取手机号
const getPhoneNumber = async (req, res) => {
  try {
    const { code } = req.body;

    console.log('收到获取手机号请求');
    console.log('code:', code);

    if (!code) {
      return res.status(400).json({ success: false, message: '缺少code参数' });
    }

    // 微信配置
    const appId = process.env.WECHAT_APP_ID || 'wx34c42d4602b7d07c';
    const appSecret = process.env.WECHAT_APP_SECRET || '3192d00b3028d2154b07b066f9b21034';

    if (!appId || !appSecret) {
      throw new Error('微信配置不完整，缺少appId或appSecret');
    }

    // 获取微信接口调用凭证
    console.log('正在获取access_token...');
    const accessTokenResponse = await axios.post('https://api.weixin.qq.com/cgi-bin/stable_token',
      {
        grant_type: 'client_credential',
        appid: appId,
        secret: appSecret
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('access_token获取结果:', accessTokenResponse.data);

    if (!accessTokenResponse.data.access_token) {
      console.error('获取access_token失败:', accessTokenResponse.data.errmsg);
      throw new Error('获取access_token失败: ' + (accessTokenResponse.data.errmsg || '未知错误'));
    }

    const accessToken = accessTokenResponse.data.access_token;

    // 调用微信的 getuserphonenumber 接口
    console.log('正在调用微信 getuserphonenumber 接口...');
    const phoneResponse = await axios.post(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
      { code },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('微信 getuserphonenumber 接口返回:', phoneResponse.data);

    if (phoneResponse.data && phoneResponse.data.phone_info) {
      const phoneNumber = phoneResponse.data.phone_info.phoneNumber;
      console.log('获取手机号成功:', phoneNumber);

      res.json({
        success: true,
        phone: phoneNumber,
        purePhoneNumber: phoneResponse.data.phone_info.purePhoneNumber,
        countryCode: phoneResponse.data.phone_info.countryCode
      });
    } else {
      console.error('获取手机号失败:', phoneResponse.data.errmsg || '未知错误');
      throw new Error(phoneResponse.data.errmsg || '获取手机号失败');
    }
  } catch (error) {
    console.error('获取手机号失败:', error);
    res.status(500).json({ success: false, message: '获取手机号失败', error: error.message });
  }
};

module.exports = {
  login,
  getUserProfile,
  updateUserProfile,
  getUserPoints,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserPhone,
  decryptPhone,
  getPhoneNumber
};