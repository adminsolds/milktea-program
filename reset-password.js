const bcrypt = require('bcrypt');
const { Admin } = require('./models');

async function resetPassword() {
  try {
    const admin = await Admin.findOne({
      where: { username: 'superadmin' }
    });

    if (!admin) {
      console.log('❌ 管理员账号不存在');
      process.exit(1);
    }

    // 重置密码为 123456
    const hashedPassword = await bcrypt.hash('123456', 10);
    await admin.update({ password: hashedPassword });

    console.log('✅ 密码重置成功！');
    console.log('用户名: superadmin');
    console.log('密码: 123456');
    process.exit(0);
  } catch (error) {
    console.error('❌ 重置密码失败:', error);
    process.exit(1);
  }
}

resetPassword();
