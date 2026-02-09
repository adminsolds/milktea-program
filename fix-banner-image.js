const { Banner } = require('./models');
const { sequelize } = require('./config/db');

async function fixBannerImage() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 更新第一个轮播图的图片URL
    const banner = await Banner.findByPk(1);
    if (banner) {
      await banner.update({
        image: '/images/banners/banner1.svg'
      });
      console.log('已修复轮播图ID 1的图片URL');
    }
    
    // 查看所有轮播图
    const banners = await Banner.findAll({
      where: {
        is_active: 1,
        position: 'home'
      }
    });
    
    console.log('\n修复后轮播图列表:');
    banners.forEach((banner, index) => {
      console.log(`${index + 1}. 标题: ${banner.title}, 图片URL: ${banner.image}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('修复轮播图失败:', error.message);
    process.exit(1);
  }
}

fixBannerImage();