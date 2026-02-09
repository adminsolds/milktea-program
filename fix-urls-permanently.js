const { Banner } = require('./models');
const { sequelize } = require('./config/db');

async function fixUrlsPermanently() {
  try {
    console.log('=== 永久修复轮播图URL ===');
    console.log('当前时间:', new Date().toLocaleString());
    
    // 获取所有轮播图
    const banners = await Banner.findAll();
    console.log('\n1. 处理轮播图数量:', banners.length);
    
    // 更新每个轮播图的图片URL为完整URL
    let updatedCount = 0;
    for (const banner of banners) {
      const oldUrl = banner.image;
      if (oldUrl && !oldUrl.startsWith('http')) {
        const newUrl = `http://localhost:3000${oldUrl}`;
        await banner.update({ image: newUrl });
        console.log(`   已更新: ID ${banner.id} - ${oldUrl} → ${newUrl}`);
        updatedCount++;
      }
    }
    
    console.log(`\n2. 更新完成: 共处理 ${banners.length} 个轮播图，更新了 ${updatedCount} 个`);
    
    // 查看更新后的轮播图
    const updatedBanners = await Banner.findAll();
    console.log('\n3. 更新后轮播图列表:');
    updatedBanners.forEach(banner => {
      console.log(`   ID ${banner.id}: ${banner.title} - ${banner.image}`);
    });
    
    // 修改控制器代码，简化逻辑，确保所有图片URL都返回完整URL
    const fs = require('fs');
    const path = require('path');
    const controllerPath = path.join(__dirname, 'controllers', 'uiController.js');
    let controllerContent = fs.readFileSync(controllerPath, 'utf8');
    
    // 简化ensureFullUrl函数，使用固定的baseUrl
    const simplifiedEnsureFullUrl = `// 辅助函数：确保图片URL是完整URL
function ensureFullUrl(url) {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  return 'http://localhost:3000' + url;
}`;
    
    // 移除调试日志（如果有），添加简化版本
    controllerContent = controllerContent.replace(/function ensureFullUrl[\s\S]*?^}/m, simplifiedEnsureFullUrl);
    
    // 确保createBanner和updateBanner函数调用ensureFullUrl时不带req参数
    controllerContent = controllerContent.replace(
      'image = ensureFullUrl(image, req);',
      'image = ensureFullUrl(image);'
    );
    
    // 移除调试日志
    controllerContent = controllerContent.replace(/console\.log\([\s\S]*?\);/g, '');
    
    fs.writeFileSync(controllerPath, controllerContent, 'utf8');
    console.log('\n4. 已简化控制器代码，移除调试日志');
    
    // 重启服务器提示
    console.log('\n=== 操作完成 ===');
    console.log('请重启服务器以应用更改：');
    console.log('node app.js');
    
    await sequelize.close();
    return {
      success: true,
      message: `已修复${updatedCount}个轮播图URL`,
      total: banners.length
    };
    
  } catch (error) {
    console.error('修复URL失败:', error.message);
    console.error('错误堆栈:', error.stack);
    return {
      success: false,
      message: error.message
    };
  }
}

fixUrlsPermanently();