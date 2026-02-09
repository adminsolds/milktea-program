const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function debugBannerApi() {
  try {
    console.log('=== 调试轮播图API ===');
    console.log('当前时间:', new Date().toLocaleString());
    
    // 1. 测试API是否正常响应
    const response = await axios.get('http://localhost:3000/api/ui/banners?position=home&is_active=1');
    console.log('\n1. API响应状态:', response.status);
    console.log('API响应数据:', JSON.stringify(response.data, null, 2));
    
    // 2. 检查轮播图数据格式
    const banners = response.data.banners;
    console.log('\n2. 轮播图数量:', banners.length);
    
    banners.forEach((banner, index) => {
      console.log(`\n   轮播图 ${index + 1}:`);
      console.log(`   ID: ${banner.id}`);
      console.log(`   标题: ${banner.title}`);
      console.log(`   图片URL: ${banner.image}`);
      console.log(`   URL格式: ${banner.image.startsWith('http') ? '完整URL ✓' : '相对URL ✗'}`);
      console.log(`   状态: ${banner.is_active ? '活跃 ✓' : '禁用 ✗'}`);
      console.log(`   位置: ${banner.position}`);
      console.log(`   创建时间: ${banner.createdAt}`);
      console.log(`   更新时间: ${banner.updatedAt}`);
      
      // 3. 检查图片文件是否存在（仅本地文件）
      if (banner.image.startsWith('http://localhost:3000/uploads/')) {
        const imagePath = banner.image.replace('http://localhost:3000', '');
        const fullPath = path.join(__dirname, imagePath);
        const fileExists = fs.existsSync(fullPath);
        console.log(`   文件存在: ${fileExists ? '是 ✓' : '否 ✗'}`);
        if (fileExists) {
          const stats = fs.statSync(fullPath);
          console.log(`   文件大小: ${Math.round(stats.size / 1024)}KB`);
        }
      }
    });
    
    // 4. 测试直接访问图片URL
    if (banners.length > 0) {
      const firstBanner = banners[0];
      console.log(`\n3. 测试直接访问第一张图片: ${firstBanner.image}`);
      try {
        const imageResponse = await axios.get(firstBanner.image, {
          responseType: 'arraybuffer'
        });
        console.log(`   图片请求状态: ${imageResponse.status} ✓`);
        console.log(`   图片类型: ${imageResponse.headers['content-type']}`);
        console.log(`   图片大小: ${Math.round(imageResponse.data.length / 1024)}KB`);
      } catch (imageError) {
        console.log(`   图片请求失败: ${imageError.message} ✗`);
      }
    }
    
  } catch (error) {
    console.error('API调试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

debugBannerApi();