const axios = require('axios');

async function testNewBanner() {
  try {
    console.log('=== 测试新增轮播图 ===');
    console.log('当前时间:', new Date().toLocaleString());
    
    // 1. 先获取现有轮播图数量
    const beforeResponse = await axios.get('http://localhost:3000/api/ui/banners?position=home&is_active=1');
    console.log('\n1. 新增前轮播图数量:', beforeResponse.data.banners.length);
    
    // 2. 创建新轮播图，使用相对URL测试
    const newBannerData = {
      title: '测试自动完整URL',
      image: '/uploads/test-banner.jpg', // 使用相对URL测试
      link: 'https://example.com',
      position: 'home',
      sort_order: 99,
      is_active: 1
    };
    
    console.log('\n2. 创建新轮播图，使用相对URL:', newBannerData.image);
    const createResponse = await axios.post('http://localhost:3000/api/ui/banners', newBannerData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n3. 新增轮播图响应:', createResponse.status);
    const newBanner = createResponse.data;
    console.log('新增轮播图ID:', newBanner.id);
    console.log('新增轮播图标题:', newBanner.title);
    console.log('返回的图片URL:', newBanner.image);
    console.log('URL格式:', newBanner.image.startsWith('http') ? '完整URL ✓' : '相对URL ✗');
    
    // 3. 再次获取轮播图，验证新增成功
    const afterResponse = await axios.get('http://localhost:3000/api/ui/banners?position=home&is_active=1');
    console.log('\n4. 新增后轮播图数量:', afterResponse.data.banners.length);
    
    // 4. 检查新增的轮播图
    const addedBanner = afterResponse.data.banners.find(b => b.id === newBanner.id);
    if (addedBanner) {
      console.log('\n5. 数据库中新增的轮播图:');
      console.log('ID:', addedBanner.id);
      console.log('标题:', addedBanner.title);
      console.log('图片URL:', addedBanner.image);
      console.log('URL格式:', addedBanner.image.startsWith('http') ? '完整URL ✓' : '相对URL ✗');
    }
    
    // 5. 清理测试数据
    console.log('\n6. 清理测试数据...');
    await axios.delete(`http://localhost:3000/api/ui/banners/${newBanner.id}`);
    console.log('测试轮播图已删除');
    
    // 6. 最终验证
    const finalResponse = await axios.get('http://localhost:3000/api/ui/banners?position=home&is_active=1');
    console.log('\n7. 清理后轮播图数量:', finalResponse.data.banners.length);
    
    console.log('\n=== 测试完成 ===');
    console.log('结论:', '新增轮播图自动获取完整URL功能' + (addedBanner.image.startsWith('http') ? ' ✓ 正常工作' : ' ✗ 存在问题'));
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testNewBanner();