const { Category } = require('../models');
const sequelize = require('../config/db').sequelize;

// 修复分类表中的图片 URL
const fixCategoryUrls = async () => {
  try {
    console.log('检查分类表中的图片 URL...\n');

    // 先查询所有分类
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'icon']
    });

    console.log(`找到 ${categories.length} 条分类记录\n`);

    let fixedCount = 0;

    for (const category of categories) {
      const oldIcon = category.icon;

      // 检查是否包含 http://localhost:3000
      if (oldIcon && oldIcon.includes('http://localhost:3000')) {
        const newIcon = oldIcon.replace(/http:\/\/localhost:3000/g, '');
        console.log(`Category #${category.id} (${category.name}):`);
        console.log(`  修复前: ${oldIcon}`);
        console.log(`  修复后: ${newIcon}`);

        await Category.update(
          { icon: newIcon },
          { where: { id: category.id } }
        );
        fixedCount++;
      } else {
        console.log(`Category #${category.id} (${category.name}): ✓ 无需修复`);
      }
    }

    console.log(`\n✓ 分类表检查完成，修复了 ${fixedCount} 条记录`);

    // 验证修复结果
    console.log('\n验证修复结果...');
    const verifyCategories = await Category.findAll({
      attributes: ['id', 'name', 'icon']
    });

    verifyCategories.forEach(cat => {
      if (cat.icon && cat.icon.includes('http://')) {
        console.log(`⚠️  Category #${cat.id} 仍包含 HTTP URL: ${cat.icon}`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('修复失败:', error.message);
    process.exit(1);
  }
};

// 运行修复
fixCategoryUrls();
