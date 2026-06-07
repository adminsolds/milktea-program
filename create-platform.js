const { DeliveryPlatform } = require('./models');

async function createPlatformConfig() {
  try {
    console.log('创建配送平台配置...\n');

    // 检查是否已存在
    const existing = await DeliveryPlatform.findOne({ where: { code: 'waimai' } });
    if (existing) {
      console.log('配送平台已存在:', existing.toJSON());
      
      // 更新配置
      await existing.update({
        name: '半夏配送',
        api_url: 'http://localhost:5173',
        app_key: 'mk_a9f07d0d93333cdb384aa0bd0412b397',
        app_secret: 'ms_f0d913d402a0e5c064e902997772820deb088ab3d17bb44eca9e0f158e12602e',
        callback_url: 'http://localhost:8080/api/delivery/callback',
        is_active: true
      });
      
      console.log('配送平台配置已更新!');
    } else {
      // 创建新配置
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
      
      console.log('配送平台配置已创建:', platform.toJSON());
    }
    
    console.log('\n完成!');
    process.exit(0);
  } catch (error) {
    console.error('创建失败:', error);
    process.exit(1);
  }
}

createPlatformConfig();