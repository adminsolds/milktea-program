const { sequelize } = require('../config/db');

async function addProductImageField() {
  try {
    console.log('开始添加 product_image 字段到 order_items 表...');
    
    // 检查字段是否已存在
    const [results] = await sequelize.query(
      "SHOW COLUMNS FROM order_items LIKE 'product_image'"
    );
    
    if (results.length > 0) {
      console.log('product_image 字段已存在，跳过添加');
      return;
    }
    
    // 添加字段
    await sequelize.query(
      "ALTER TABLE order_items ADD COLUMN product_image VARCHAR(255) NULL COMMENT '商品图片'"
    );
    
    console.log('product_image 字段添加成功！');
  } catch (error) {
    console.error('添加字段失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

addProductImageField();
