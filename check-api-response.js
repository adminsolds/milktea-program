const axios = require('axios');

async function checkApiResponse() {
  try {
    // 测试首页轮播图API
    const bannersResponse = await axios.get('http://localhost:3000/api/ui/banners?position=home&is_active=1');
    console.log('=== 首页轮播图API响应 ===');
    console.log('状态码:', bannersResponse.status);
    console.log('响应数据:', JSON.stringify(bannersResponse.data, null, 2));
    console.log('数据格式:', Array.isArray(bannersResponse.data.banners) ? '数组' : '非数组');
    console.log('轮播图数量:', bannersResponse.data.banners.length);
    
    // 测试功能入口API
    const functionsResponse = await axios.get('http://localhost:3000/api/ui/function-entries?position=home&is_active=1');
    console.log('\n=== 功能入口API响应 ===');
    console.log('状态码:', functionsResponse.status);
    console.log('响应数据:', JSON.stringify(functionsResponse.data, null, 2));
    console.log('数据格式:', Array.isArray(functionsResponse.data.functionEntries) ? '数组' : '非数组');
    console.log('功能入口数量:', functionsResponse.data.functionEntries ? functionsResponse.data.functionEntries.length : '0');
    
    // 测试新品推荐API
    const newProductsResponse = await axios.get('http://localhost:3000/api/ui/new-products?position=home&is_active=1');
    console.log('\n=== 新品推荐API响应 ===');
    console.log('状态码:', newProductsResponse.status);
    console.log('响应数据:', JSON.stringify(newProductsResponse.data, null, 2));
    console.log('数据格式:', Array.isArray(newProductsResponse.data.newProducts) ? '数组' : '非数组');
    console.log('新品数量:', newProductsResponse.data.newProducts ? newProductsResponse.data.newProducts.length : '0');
    
  } catch (error) {
    console.error('API请求失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

checkApiResponse();