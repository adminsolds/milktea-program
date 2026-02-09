const axios = require('axios');

async function testFullUrl() {
  try {
    // 测试首页轮播图API
    const response = await axios.get('http://localhost:3000/api/ui/banners?position=home&is_active=1');
    console.log('=== 首页轮播图API响应 ===');
    console.log('状态码:', response.status);
    
    response.data.banners.forEach((banner, index) => {
      console.log(`\n轮播图 ${index + 1}:`);
      console.log('标题:', banner.title);
      console.log('图片URL:', banner.image);
      console.log('是否为完整URL:', banner.image.startsWith('http') ? '是 ✓' : '否 ✗');
      console.log('URL格式:', banner.image.startsWith('http://localhost:3000') ? '本地完整URL ✓' : '其他完整URL ✓');
    });
    
    console.log('\n=== 功能入口API响应 ===');
    const functionsResponse = await axios.get('http://localhost:3000/api/ui/function-entries?position=home&is_active=1');
    functionsResponse.data.functionEntries.forEach((entry, index) => {
      if (index < 2) { // 只显示前2个
        console.log(`\n功能入口 ${index + 1}:`);
        console.log('名称:', entry.name);
        console.log('图标URL:', entry.icon);
        console.log('是否为完整URL:', entry.icon.startsWith('http') ? '是 ✓' : '否 ✗');
      }
    });
    
  } catch (error) {
    console.error('API请求失败:', error.message);
  }
}

testFullUrl();