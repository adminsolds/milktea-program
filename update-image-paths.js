const { sequelize } = require('./config/db');
const { Banner, FunctionEntry } = require('./models');

async function updateImagePaths() {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    // 更新轮播图图片路径
    console.log('更新轮播图图片路径...');
    const banners = await Banner.findAll();
    for (const banner of banners) {
      if (banner.image && banner.image.endsWith('.png')) {
        const newImagePath = banner.image.replace(/\.png$/, '.svg');
        await banner.update({ image: newImagePath });
        console.log(`更新轮播图 ${banner.id}: ${banner.image} -> ${newImagePath}`);
      }
    }

    // 更新功能入口图标路径
    console.log('更新功能入口图标路径...');
    const functionEntries = await FunctionEntry.findAll();
    for (const entry of functionEntries) {
      if (entry.icon && entry.icon.endsWith('.png')) {
        const newIconPath = entry.icon.replace(/\.png$/, '.svg');
        await entry.update({ icon: newIconPath });
        console.log(`更新功能入口 ${entry.id}: ${entry.icon} -> ${newIconPath}`);
      }
    }

    console.log('所有图片路径更新完成！');
    process.exit(0);
  } catch (error) {
    console.error('更新图片路径失败:', error);
    process.exit(1);
  }
}

updateImagePaths();