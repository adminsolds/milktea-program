const axios = require('axios');

async function createTestBanner() {
  try {
    const bannerData = {
      title: '测试轮播图',
      image: '/images/banners/banner1.svg',
      link: 'https://example.com',
      position: 'home',
      sort_order: 1,
      is_active: 1
    };
    
    const apiUrl = 'http://localhost:3000/api/ui/banners';
    console.log(`创建测试轮播图: ${apiUrl}`);
    
    const response = await axios.post(apiUrl, bannerData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✓ 测试轮播图创建成功:');
    console.log('ID:', response.data.id);
    console.log('标题:', response.data.title);
    console.log('图片URL:', response.data.image);
    console.log('位置:', response.data.position);
    console.log('状态:', response.data.is_active ? '活跃' : '不活跃');
    
    // 获取所有轮播图，确认创建成功
    const listResponse = await axios.get('http://localhost:3000/api/ui/banners?position=home&is_active=1');
    console.log('\n当前轮播图列表:');
    listResponse.data.banners.forEach(banner => {
      console.log(`ID: ${banner.id}, 标题: ${banner.title}`);
    });
    
  } catch (error) {
    console.error('✗ 创建测试轮播图失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

createTestBanner();