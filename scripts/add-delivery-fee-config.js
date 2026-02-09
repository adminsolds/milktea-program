const { SystemConfig } = require('../models');

async function addDeliveryFeeConfig() {
  try {
    console.log('开始添加配送费配置...');
    
    // 检查配置是否已存在
    const existingConfig = await SystemConfig.findByPk('delivery_fee');
    
    if (existingConfig) {
      console.log('配送费配置已存在:', existingConfig.value);
      return;
    }
    
    // 添加配送费配置，默认5元
    await SystemConfig.create({
      key: 'delivery_fee',
      value: '5.00',
      description: '外卖配送费（元）',
      category: 'order'
    });
    
    console.log('配送费配置添加成功！默认值为 5.00 元');
  } catch (error) {
    console.error('添加配送费配置失败:', error.message);
  } finally {
    process.exit(0);
  }
}

addDeliveryFeeConfig();
