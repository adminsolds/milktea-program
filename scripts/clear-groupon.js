const { GroupBuy } = require('../models');

// 删除所有团购数据
const clearGrouponData = async () => {
  try {
    const count = await GroupBuy.count();
    console.log(`准备删除 ${count} 条团购数据...`);

    const result = await GroupBuy.destroy({
      where: {},
      truncate: true
    });

    console.log(`✓ 成功删除 ${result} 条团购数据`);
    console.log('现在可以在后台管理界面手动创建团购活动了');
    console.log('后台地址: http://localhost:3000');

    process.exit(0);
  } catch (error) {
    console.error('删除失败:', error.message);
    process.exit(1);
  }
};

clearGrouponData();
