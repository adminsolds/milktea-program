const { sequelize } = require('./models');

async function checkDeliveryPlatforms() {
  try {
    console.log('查询配送平台配置...');
    
    const [platforms] = await sequelize.query(
      'SELECT * FROM delivery_platforms',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('配送平台配置:');
    console.log(JSON.stringify(platforms, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkDeliveryPlatforms();