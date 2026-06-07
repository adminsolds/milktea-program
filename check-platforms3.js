const { DeliveryPlatform } = require('./models');

async function checkPlatforms() {
  try {
    console.log('查询配送平台配置...\n');
    
    const platforms = await DeliveryPlatform.findAll();
    
    if (platforms.length === 0) {
      console.log('没有找到配送平台配置\n');
    } else {
      platforms.forEach((p, i) => {
        const data = p.toJSON();
        console.log(`平台 ${i+1}:`);
        console.log(JSON.stringify(data, null, 2));
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkPlatforms();