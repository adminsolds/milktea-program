const { SystemConfig } = require('../models');

async function updateDeliveryFee() {
  try {
    console.log('开始更新配送费配置...');
    
    // 更新配送费为10元
    const config = await SystemConfig.findByPk('delivery_fee');
    
    if (config) {
      await config.update({
        value: '10.00'
      });
      console.log('配送费配置更新成功！新值为 10.00 元');
    } else {
      console.log('配送费配置不存在');
    }
  } catch (error) {
    console.error('更新配送费配置失败:', error.message);
  } finally {
    process.exit(0);
  }
}

updateDeliveryFee();
