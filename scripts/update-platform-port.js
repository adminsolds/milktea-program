/**
 * 更新配送平台API端口为5000
 */

const { DeliveryPlatform } = require('../models');

async function updatePlatformPort() {
  try {
    console.log('更新配送平台API端口为5000...\n');

    // 查找半夏配送平台
    const platform = await DeliveryPlatform.findOne({
      where: { code: 'banxia' }
    });

    if (platform) {
      await platform.update({
        api_url: 'http://localhost:5000',
        is_active: true
      });
      
      console.log('✅ 已更新半夏配送平台配置');
      console.log('  API地址: http://localhost:5000');
    } else {
      console.log('未找到半夏配送平台');
    }

    // 同时更新其他平台的API地址
    const platforms = await DeliveryPlatform.findAll();
    for (const p of platforms) {
      if (p.api_url && p.api_url.includes('localhost:3456')) {
        await p.update({
          api_url: p.api_url.replace('localhost:3456', 'localhost:5000')
        });
        console.log(`✅ 已更新 ${p.name} 的API地址为: ${p.api_url}`);
      }
    }

    console.log('\n配置更新完成！');
    
  } catch (error) {
    console.error('更新配置失败:', error);
    process.exit(1);
  }
}

updatePlatformPort();
