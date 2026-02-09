const axios = require('axios');

async function testDeleteBanner() {
  try {
    const bannerId = 1; // 测试删除ID为1的轮播图
    const apiUrl = `http://localhost:3000/api/ui/banners/${bannerId}`;
    console.log(`测试DELETE API: ${apiUrl}`);
    
    // 先获取轮播图列表，查看要删除的轮播图
    console.log('\n1. 获取轮播图列表:');
    const listResponse = await axios.get('http://localhost:3000/api/ui/banners?position=home&is_active=1');
    console.log('当前轮播图数量:', listResponse.data.banners.length);
    listResponse.data.banners.forEach(banner => {
      console.log(`ID: ${banner.id}, 标题: ${banner.title}, 状态: ${banner.is_active ? '活跃' : '不活跃'}`);
    });
    
    // 执行删除操作
    console.log(`\n2. 删除轮播图 (ID: ${bannerId}):`);
    const deleteResponse = await axios.delete(apiUrl);
    console.log('删除状态:', deleteResponse.status, deleteResponse.statusText);
    console.log('删除响应:', deleteResponse.data);
    
    // 再次获取轮播图列表，确认删除成功
    console.log('\n3. 再次获取轮播图列表:');
    const updatedListResponse = await axios.get('http://localhost:3000/api/ui/banners?position=home&is_active=1');
    console.log('删除后轮播图数量:', updatedListResponse.data.banners.length);
    updatedListResponse.data.banners.forEach(banner => {
      console.log(`ID: ${banner.id}, 标题: ${banner.title}, 状态: ${banner.is_active ? '活跃' : '不活跃'}`);
    });
    
    console.log('\n✓ DELETE API测试成功！');
  } catch (error) {
    console.error('\n✗ DELETE API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但没有收到响应');
    }
  }
}

testDeleteBanner();