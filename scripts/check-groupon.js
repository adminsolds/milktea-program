const { GroupBuy } = require('../models');

// 检查团购数据
const checkGrouponData = async () => {
  try {
    const groupBuys = await GroupBuy.findAll({
      order: [['id', 'ASC']]
    });

    console.log(`数据库中共有 ${groupBuys.length} 条团购数据:\n`);

    groupBuys.forEach((item, index) => {
      console.log(`${index + 1}. ID=${item.id}`);
      console.log(`   名称: ${item.name}`);
      console.log(`   价格: ¥${item.original_price} → ¥${item.groupon_price}`);
      console.log(`   状态: ${item.status}`);
      console.log(`   创建时间: ${item.createdAt}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error.message);
    process.exit(1);
  }
};

checkGrouponData();
