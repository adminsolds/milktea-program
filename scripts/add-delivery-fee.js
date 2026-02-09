/**
 * 添加商品配送费字段迁移脚本
 * 运行方式: node scripts/add-delivery-fee.js
 */

const { sequelize } = require('../config/db');

async function addDeliveryFeeField() {
    try {
        console.log('开始添加商品配送费字段...');

        // 检查字段是否已存在
        const [results] = await sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME = 'delivery_fee'
        `);

        if (results.length > 0) {
            console.log('delivery_fee 字段已存在，跳过添加');
            return;
        }

        // 添加 delivery_fee 字段
        await sequelize.query(`
            ALTER TABLE products 
            ADD COLUMN delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 
            COMMENT '配送费'
            AFTER price_large
        `);

        console.log('✅ delivery_fee 字段添加成功！');
    } catch (error) {
        console.error('❌ 添加字段失败:', error.message);
        throw error;
    }
}

// 运行迁移
addDeliveryFeeField()
    .then(() => {
        console.log('迁移完成');
        process.exit(0);
    })
    .catch((error) => {
        console.error('迁移失败:', error);
        process.exit(1);
    });
