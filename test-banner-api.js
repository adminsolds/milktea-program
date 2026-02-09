const axios = require('axios');

async function testBannerAPI() {
  try {
    const apiUrl = 'http://localhost:3000/api/ui/banners?position=home&is_active=1';
    console.log(`测试API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl);
    console.log('\nAPI响应状态:', response.status);
    console.log('API响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.banners && response.data.banners.length > 0) {
      console.log('\n轮播图列表:', response.data.banners.length);
      response.data.banners.forEach((banner, index) => {
        console.log(`\n${index + 1}. 标题: ${banner.title}`);
        console.log(`   图片URL: ${banner.image}`);
        console.log(`   链接: ${banner.link}`);
        console.log(`   状态: ${banner.is_active ? '活跃' : '不活跃'}`);
        console.log(`   位置: ${banner.position}`);
        console.log(`   是否为有效URL: ${banner.image && (banner.image.startsWith('/') || banner.image.startsWith('http')) ? '是' : '否'}`);
      });
    }
  } catch (error) {
    console.error('API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testBannerAPI();