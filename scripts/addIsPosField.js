const { sequelize } = require('../config/db');

async function addIsPosField() {
  try {
    console.log('正在添加 is_pos 字段到 orders 表...');

    await sequelize.query(`
      ALTER TABLE \`orders\`
      ADD COLUMN \`is_pos\` TINYINT(1) NOT NULL DEFAULT 0
      COMMENT '是否为POS现场点单订单'
      AFTER \`pickup_minutes\`
    `);

    console.log('is_pos 字段添加成功！');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('is_pos 字段已存在，跳过。');
      process.exit(0);
    } else {
      console.error('添加字段失败:', error.message);
      process.exit(1);
    }
  }
}

addIsPosField();
