const { sequelize } = require('./config/db');
const { DeliveryPlatform } = require('./models');

async function createPlatformConfig() {
  try {
    console.log('1. 测试数据库连接...');
    
    await sequelize.authenticate();
    console.log('   ✅ SQLite 数据库连接成功!\n');
    
    console.log('2. 检查是否已存在...');
    const existing = await DeliveryPlatform.findOne({ where: { code: 'waimai' } });
    
    if (existing) {
      console.log('   配送平台已存在，更新配置...');
      await existing.update({
        name: '半夏配送',
        api_url: 'http://localhost:5173',
        app_key: 'mk_a9f07d0d93333cdb384aa0bd0412b397',
        app_secret: 'ms_f0d913d402a0e5c064e902997772820deb088ab3d17bb44eca9e0f158e12602e',
        callback_url: 'http://localhost:8080/api/delivery/callback',
        is_active: true
      });
      console.log('   ✅ 更新成功!\n');
    } else {
      console.log('   不存在，创建新配置...');
      const platform = await DeliveryPlatform.create({
        name: '半夏配送',
        code: 'waimai',
        platform_type: 'food_delivery',
        api_url: 'http://localhost:5173',
        app_key: 'mk_a9f07d0d93333cdb384aa0bd0412b397',
        app_secret: 'ms_f0d913d402a0e5c064e902997772820deb088ab3d17bb44eca9e0f158e12602e',
        callback_url: 'http://localhost:8080/api/delivery/callback',
        is_active: true
      });
      console.log('   ✅ 创建成功! ID:', platform.id, '\n');
    }
    
    console.log('3. 验证配置...');
    const final = await DeliveryPlatform.findOne({ where: { code: 'waimai' } });
    console.log('   配置内容:', JSON.stringify(final.toJSON(), null, 2));
    
    console.log('\n✅ 所有操作完成!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createPlatformConfig();