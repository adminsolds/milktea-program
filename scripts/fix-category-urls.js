const { Category } = require('../models');

// 修复分类表中的图片 URL
const fixCategoryUrls = async () => {
  try {
    console.log('开始修复分类表中的图片 URL...\n');

    const categories = await Category.findAll();
    let fixedCount = 0;

    for (const category of categories) {
      if (category.icon && category.icon.startsWith('http://localhost:3000')) {
        const newIcon = category.icon.replace('http://localhost:3000', '');
        await category.update({ icon: newIcon });
        console.log(`  Category #${category.id} (${category.name}):`);
        console.log(`    ${category.icon}`);
        console.log(`    -> ${newIcon}`);
        fixedCount++;
      }
    }

    console.log(`\n✓ 分类表修复完成，共处理 ${fixedCount} 条记录`);
    process.exit(0);
  } catch (error) {
    console.error('修复失败:', error.message);
    process.exit(1);
  }
};

// 运行修复
fixCategoryUrls();
