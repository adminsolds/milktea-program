const { Category } = require('../models');

// 检查分类表中的实际数据
const checkCategoryData = async () => {
  try {
    console.log('查询分类表中的实际数据...\n');

    const categories = await Category.findAll({
      attributes: ['id', 'name', 'icon'],
      order: [['id', 'ASC']]
    });

    categories.forEach(cat => {
      console.log(`Category #${cat.id}: ${cat.name}`);
      console.log(`  icon: ${cat.icon}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error.message);
    process.exit(1);
  }
};

// 运行检查
checkCategoryData();
