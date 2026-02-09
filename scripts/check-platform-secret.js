/**
 * 检查奶茶店后台数据库中的配送平台配置
 */

const { DeliveryPlatform } = require('../models');

async function checkPlatformSecret() {
  try {
    console.log('========================================');
    console.log('   检查配送平台配置');
    console.log('========================================\n');

    // 查找所有配送平台
    const platforms = await DeliveryPlatform.findAll();
    
    console.log(`找到 ${platforms.length} 个配送平台:\n`);

    const expectedSecret = 'sk_ttl6wnosjyml4yrjww_ndl2msim';

    platforms.forEach((platform, index) => {
      console.log(`平台 ${index + 1}:`);
      console.log('  ID:', platform.id);
      console.log('  代码:', platform.code);
      console.log('  名称:', platform.name);
      console.log('  API URL:', platform.api_url);
      console.log('  App Key:', platform.app_key);
      console.log('  App Secret:', platform.app_secret);
      console.log('  是否匹配:', platform.app_secret === expectedSecret ? '✅ 匹配' : '❌ 不匹配');
      console.log('  状态:', platform.is_active ? '启用' : '禁用');
      console.log('');
    });

    // 特别检查 banxia 平台
    console.log('========================================');
    console.log('   特别检查 banxia 平台');
    console.log('========================================\n');

    const banxia = await DeliveryPlatform.findOne({
      where: { code: 'banxia' }
    });

    if (banxia) {
      console.log('平台代码:', banxia.code);
      console.log('平台名称:', banxia.name);
      console.log('App Secret:', banxia.app_secret);
      console.log('期望 Secret:', expectedSecret);
      console.log('是否匹配:', banxia.app_secret === expectedSecret ? '✅ 匹配' : '❌ 不匹配');
      
      if (banxia.app_secret !== expectedSecret) {
        console.log('\n⚠️  App Secret 不匹配，需要更新！');
      }
    } else {
      console.log('❌ 未找到 banxia 平台配置');
    }

  } catch (error) {
    console.error('检查失败:', error.message);
    process.exit(1);
  }
}

checkPlatformSecret();
