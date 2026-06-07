const { DeliveryPlatform } = require('./models');

async function check() {
  try {
    console.log('检查配送平台...');
    const platforms = await DeliveryPlatform.findAll();
    console.log('平台数量:', platforms.length);
    platforms.forEach(p => {
      console.log(`- ${p.name} (${p.code}): ${p.api_url}, 启用: ${p.is_active}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

check();