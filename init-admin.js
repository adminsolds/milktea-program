const bcrypt = require('bcrypt');
const { Admin } = require('./models');

async function initAdmin() {
  try {
    // 检查是否已存在管理员
    const existingAdmin = await Admin.findOne({
      where: { username: 'superadmin' }
    });

    if (existingAdmin) {
      console.log('管理员账号已存在，跳过创建');
      process.exit(0);
    }

    // 创建默认管理员
    const hashedPassword = await bcrypt.hash('123456', 10);
    const admin = await Admin.create({
      username: 'superadmin',
      password: hashedPassword,
      nickname: '超级管理员',
      role: 'admin',
      is_active: 1
    });

    console.log('✅ 默认管理员创建成功！');
    console.log('用户名: superadmin');
    console.log('密码: 123456');
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建管理员失败:', error);
    process.exit(1);
  }
}

initAdmin();
