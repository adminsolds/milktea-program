const { sequelize } = require('../config/db');

async function modifyUserIdField() {
  try {
    console.log('正在修改 orders 表的 user_id 字段，允许为 NULL...');

    await sequelize.query(`
      ALTER TABLE \`orders\`
      MODIFY COLUMN \`user_id\` INT(11) NULL
      COMMENT '用户ID（POS现场点单时可为空）'
    `);

    console.log('user_id 字段修改成功！');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('user_id 字段已是正确的格式，跳过。');
      process.exit(0);
    } else {
      console.error('修改字段失败:', error.message);
      process.exit(1);
    }
  }
}

modifyUserIdField();
