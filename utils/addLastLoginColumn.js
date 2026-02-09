/**
 * 为 users 表添加 last_login_at 字段
 * 使用方法：在backend目录下运行 node utils/addLastLoginColumn.js
 */

const { sequelize } = require('../config/db');

const addLastLoginColumn = async () => {
  try {
    console.log('开始连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    console.log('正在检查 last_login_at 字段是否存在...');

    // 检查字段是否已存在
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users'
      AND COLUMN_NAME = 'last_login_at'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (results.length > 0) {
      console.log('last_login_at 字段已存在，无需添加');
    } else {
      console.log('正在添加 last_login_at 字段...');
      await sequelize.query(`
        ALTER TABLE users
        ADD COLUMN last_login_at DATETIME NULL COMMENT '最后登录时间'
        AFTER is_active
      `);
      console.log('last_login_at 字段添加成功！');
    }

  } catch (error) {
    console.error('添加 last_login_at 字段失败:', error);
  } finally {
    await sequelize.close();
    console.log('\n数据库连接已关闭！');
    process.exit(0);
  }
};

addLastLoginColumn();
