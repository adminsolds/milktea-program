const { Banner } = require('./models');
const { sequelize } = require('./config/db');

async function checkBanners() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 查询所有轮播图
    const banners = await Banner.findAll({
      where: {
        is_active: 1,
        position: 'home'
      }
    });
    
    console.log('\n首页活跃轮播图数量:', banners.length);
    
    if (banners.length > 0) {
      console.log('\n轮播图详情:');
      banners.forEach((banner, index) => {
        console.log(`${index + 1}. ID: ${banner.id}`);
        console.log(`   标题: ${banner.title}`);
        console.log(`   图片: ${banner.image}`);
        console.log(`   链接: ${banner.link}`);
        console.log(`   状态: ${banner.is_active ? '活跃' : '不活跃'}`);
        console.log(`   位置: ${banner.position}`);
        console.log(`   创建时间: ${banner.created_at}`);
        console.log('');
      });
    } else {
      console.log('\n数据库中没有首页活跃的轮播图');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('检查轮播图失败:', error.message);
    process.exit(1);
  }
}

checkBanners();