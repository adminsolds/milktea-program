const { Store } = require('./models');
const { sequelize } = require('./config/db');

async function updateStoreName() {
  try {
    console.log('开始更新店铺名称...');

    // 查找第一个店铺
    const store = await Store.findOne();

    if (!store) {
      console.log('未找到店铺，请先创建店铺');
      await sequelize.close();
      return;
    }

    console.log('当前店铺名称:', store.name);

    // 更新店铺名称
    await store.update({
      name: '半夏奶茶店'
    });

    console.log('店铺名称已更新为:', store.name);

    // 关闭数据库连接
    await sequelize.close();
  } catch (error) {
    console.error('更新店铺名称失败:', error);
    process.exit(1);
  }
}

updateStoreName();
