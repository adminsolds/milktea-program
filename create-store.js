const { Store } = require('./models');
const { sequelize } = require('./config/db');

async function createDefaultStore() {
  try {
    console.log('开始创建默认店铺...');

    // 检查是否已有店铺
    const existingStore = await Store.findOne();
    if (existingStore) {
      console.log('已存在店铺:', existingStore.name);
      return;
    }

    // 创建默认店铺
    const store = await Store.create({
      name: '甜蜜时光奶茶店',
      address: '北京市朝阳区三里屯路88号',
      phone: '010-12345678',
      business_hours: '10:00-22:00',
      status: 'active'
    });

    console.log('默认店铺创建成功:', store.name, 'ID:', store.id);

    // 关闭数据库连接
    await sequelize.close();
  } catch (error) {
    console.error('创建店铺失败:', error);
    process.exit(1);
  }
}

createDefaultStore();
