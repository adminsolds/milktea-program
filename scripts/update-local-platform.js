/**
 * 更新本地配送平台配置
 * 将半夏配送平台的API地址指向本地模拟服务器
 */

const { DeliveryPlatform } = require('../models');

async function updateLocalPlatform() {
  try {
    console.log('更新本地配送平台配置...\n');

    // 查找半夏配送平台
    const platform = await DeliveryPlatform.findOne({
      where: { code: 'banxia' }
    });

    if (!platform) {
      console.log('未找到半夏配送平台，创建新平台...');
      
      await DeliveryPlatform.create({
        name: '半夏配送',
        code: 'banxia',
        platform_type: 'delivery_service',
        api_url: 'http://localhost:3456',
        app_key: 'local_test_key',
        app_secret: 'local_test_secret',
        callback_url: 'http://localhost:3000/api/delivery/callback',
        is_active: true,
        sort_order: 1
      });
      
      console.log('✅ 已创建本地测试平台配置');
    } else {
      // 更新现有平台配置
      await platform.update({
        api_url: 'http://localhost:3456',
        app_key: 'local_test_key',
        app_secret: 'local_test_secret',
        callback_url: 'http://localhost:3000/api/delivery/callback',
        is_active: true
      });
      
      console.log('✅ 已更新本地测试平台配置');
    }

    console.log('\n配置信息:');
    console.log('  平台名称: 半夏配送');
    console.log('  平台代码: banxia');
    console.log('  API地址: http://localhost:3456');
    console.log('  回调地址: http://localhost:3000/api/delivery/callback');
    console.log('  APP Key: local_test_key');
    console.log('  APP Secret: local_test_secret');
    
    console.log('\n现在可以使用以下命令测试本地配送流程:');
    console.log('  node scripts/test-send-order-local.js banxia');
    
  } catch (error) {
    console.error('更新配置失败:', error);
    process.exit(1);
  }
}

updateLocalPlatform();
