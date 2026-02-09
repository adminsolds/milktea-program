const { Banner, Product, FunctionEntry, NewProduct } = require('../models');
const sequelize = require('../config/db').sequelize;

// 修复数据库中的图片 URL
const fixImageUrls = async () => {
  try {
    console.log('开始修复数据库中的图片 URL...\n');

    // 修复 Banner 表
    console.log('1. 修复轮播图...');
    const banners = await Banner.findAll();
    for (const banner of banners) {
      if (banner.image && banner.image.startsWith('http://localhost:3000')) {
        const newImage = banner.image.replace('http://localhost:3000', '');
        await banner.update({ image: newImage });
        console.log(`  Banner #${banner.id}: ${banner.image} -> ${newImage}`);
      }
    }
    console.log(`✓ 轮播图修复完成，共处理 ${banners.length} 条记录\n`);

    // 修复 Product 表
    console.log('2. 修复商品图片...');
    const products = await Product.findAll();
    let productCount = 0;
    for (const product of products) {
      let updated = false;
      let updateData = {};

      if (product.image && product.image.startsWith('http://localhost:3000')) {
        updateData.image = product.image.replace('http://localhost:3000', '');
        updated = true;
      }
      if (product.images && product.images.startsWith('http://localhost:3000')) {
        updateData.images = product.images.replace('http://localhost:3000', '');
        updated = true;
      }

      if (updated) {
        await product.update(updateData);
        console.log(`  Product #${product.id}: 已更新`);
        productCount++;
      }
    }
    console.log(`✓ 商品图片修复完成，共处理 ${productCount} 条记录\n`);

    // 修复 FunctionEntry 表
    console.log('3. 修复功能入口图标...');
    const functionEntries = await FunctionEntry.findAll();
    let entryCount = 0;
    for (const entry of functionEntries) {
      if (entry.icon && entry.icon.startsWith('http://localhost:3000')) {
        const newIcon = entry.icon.replace('http://localhost:3000', '');
        await entry.update({ icon: newIcon });
        console.log(`  FunctionEntry #${entry.id}: ${entry.icon} -> ${newIcon}`);
        entryCount++;
      }
    }
    console.log(`✓ 功能入口图标修复完成，共处理 ${entryCount} 条记录\n`);

    // 修复 NewProduct 表
    console.log('4. 修复新品图片...');
    const newProducts = await NewProduct.findAll();
    let newProductCount = 0;
    for (const newProduct of newProducts) {
      if (newProduct.image && newProduct.image.startsWith('http://localhost:3000')) {
        const newImage = newProduct.image.replace('http://localhost:3000', '');
        await newProduct.update({ image: newImage });
        console.log(`  NewProduct #${newProduct.id}: ${newProduct.image} -> ${newImage}`);
        newProductCount++;
      }
    }
    console.log(`✓ 新品图片修复完成，共处理 ${newProductCount} 条记录\n`);

    console.log('✓ 所有图片 URL 修复完成！');
    process.exit(0);
  } catch (error) {
    console.error('修复失败:', error.message);
    process.exit(1);
  }
};

// 运行修复
fixImageUrls();
