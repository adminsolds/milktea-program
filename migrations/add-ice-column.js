/**
 * 添加 ice 列到 order_items 表
 */

const { sequelize } = require('../config/db');

async function migrate() {
  try {
    console.log('开始迁移...');

    // 检查列是否已存在
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'order_items'
      AND COLUMN_NAME = 'ice'
    `);

    if (results.length > 0) {
      console.log('ice 列已存在，跳过迁移');
      process.exit(0);
    }

    // 添加 ice 列
    await sequelize.query(`
      ALTER TABLE order_items
      ADD COLUMN ice VARCHAR(50) NULL COMMENT '冰度'
      AFTER sugar
    `);

    console.log('✅ 成功添加 ice 列到 order_items 表');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

migrate();
