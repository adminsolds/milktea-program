const { Banner } = require('./models');
const { sequelize } = require('./config/db');

async function updateBannerUrls() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 获取所有轮播图
    const banners = await Banner.findAll();
    console.log(`当前轮播图数量: ${banners.length}`);
    
    const baseUrl = 'http://localhost:3000';
    let updatedCount = 0;
    
    // 更新每个轮播图的图片URL为完整URL
    for (const banner of banners) {
      // 检查是否已经是完整URL
      if (banner.image && !banner.image.startsWith('http')) {
        const fullUrl = baseUrl + banner.image;
        await banner.update({ image: fullUrl });
        console.log(`已更新轮播图: ID: ${banner.id}, 标题: ${banner.title}, 旧URL: ${banner.image}, 新URL: ${fullUrl}`);
        updatedCount++;
      }
    }
    
    console.log(`\n更新完成！共处理 ${banners.length} 个轮播图，更新了 ${updatedCount} 个轮播图的URL`);
    
    // 查看更新后的轮播图
    const updatedBanners = await Banner.findAll();
    console.log('\n更新后轮播图列表:');
    updatedBanners.forEach(banner => {
      console.log(`ID: ${banner.id}, 标题: ${banner.title}, URL: ${banner.image}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('更新轮播图URL失败:', error.message);
    process.exit(1);
  }
}

updateBannerUrls();