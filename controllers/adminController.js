const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

// 管理员登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找管理员
    const admin = await Admin.findOne({
      where: { username, is_active: 1 }
    });
    
    if (!admin) {
      return res.status(401).json({
        status: 'error',
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: '用户名或密码错误'
      });
    }
    
    // 更新最后登录时间
    await admin.update({
      last_login_at: new Date()
    });
    
    // 生成JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );
    
    res.json({
      status: 'success',
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          nickname: admin.nickname,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    res.status(500).json({
      status: 'error',
      message: '登录失败，请稍后重试'
    });
  }
};

// 管理员注册（仅用于初始化管理员账号）
const register = async (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    
    // 检查用户名是否已存在
    const existingAdmin = await Admin.findOne({
      where: { username }
    });
    
    if (existingAdmin) {
      return res.status(400).json({
        status: 'error',
        message: '用户名已存在'
      });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建管理员
    const admin = await Admin.create({
      username,
      password: hashedPassword,
      nickname: nickname || username,
      role: 'admin',
      is_active: 1
    });
    
    res.json({
      status: 'success',
      message: '管理员创建成功',
      data: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('管理员注册失败:', error);
    res.status(500).json({
      status: 'error',
      message: '注册失败，请稍后重试'
    });
  }
};

// 获取管理员信息
const getAdminInfo = async (req, res) => {
  try {
    // 从token中获取管理员ID
    const admin = await Admin.findByPk(req.user.id, {
      attributes: ['id', 'username', 'nickname', 'role', 'last_login_at']
    });
    
    if (!admin) {
      return res.status(404).json({
        status: 'error',
        message: '管理员不存在'
      });
    }
    
    res.json({
      status: 'success',
      data: admin
    });
  } catch (error) {
    console.error('获取管理员信息失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取信息失败，请稍后重试'
    });
  }
};

// 初始化默认管理员账号
const initDefaultAdmin = async () => {
  try {
    // 检查是否已存在管理员
    const adminCount = await Admin.count();
    
    if (adminCount === 0) {
      // 加密密码
      const hashedPassword = await bcrypt.hash('admin', 10);
      
      // 创建默认管理员
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        nickname: '超级管理员',
        role: 'admin',
        is_active: 1
      });
      
      console.log('默认管理员创建成功: username=admin, password=admin');
    }
  } catch (error) {
    console.error('初始化默认管理员失败:', error);
  }
};

module.exports = {
  login,
  register,
  getAdminInfo,
  initDefaultAdmin
};