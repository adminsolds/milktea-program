const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试ensureFullUrl函数的逻辑
function testEnsureFullUrl() {
  console.log('=== 测试ensureFullUrl函数逻辑 ===');
  
  // 模拟函数
  function ensureFullUrl(url, baseUrl = 'http://localhost:3000') {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    
    // 使用固定URL作为后备
    return baseUrl + url;
  }
  
  // 测试用例
  const testCases = [
    ['http://example.com/image.jpg', '完整URL测试'],
    ['https://example.com/image.jpg', 'HTTPS测试'],
    ['/uploads/image.jpg', '相对路径测试'],
    ['', '空字符串测试'],
    [null, 'null值测试']
  ];
  
  testCases.forEach(([testUrl, description]) => {
    const result = ensureFullUrl(testUrl);
    console.log(`${description}:`);
    console.log(`  输入: ${testUrl}`);
    console.log(`  输出: ${result}`);
    console.log(`  成功: ${result.startsWith('http') ? '是 ✓' : '否 ✗'}`);
    console.log('');
  });
}

// 直接修改控制器文件，添加调试日志
async function addDebugLogs() {
  console.log('=== 添加调试日志到控制器 ===');
  
  const controllerPath = path.join(__dirname, 'controllers', 'uiController.js');
  let content = fs.readFileSync(controllerPath, 'utf8');
  
  // 添加调试日志到createBanner函数
  if (!content.includes('console.log')) {
    content = content.replace(
      '// 确保图片URL是完整URL',
      '// 确保图片URL是完整URL\n    console.log("\nDEBUG: 处理图片URL");\n    console.log("DEBUG: 原始URL:", image);\n    console.log("DEBUG: URL.startsWith(\'http\'):", image.startsWith(\'http\'));\n    console.log("DEBUG: 调用ensureFullUrl")'
    );
    
    content = content.replace(
      'image = ensureFullUrl(image, req);',
      'image = ensureFullUrl(image, req);\n    console.log("DEBUG: 处理后URL:", image);'
    );
    
    // 添加调试日志到ensureFullUrl函数
    content = content.replace(
      'function ensureFullUrl(url, req) {',
      'function ensureFullUrl(url, req) {\n  console.log("DEBUG: ensureFullUrl被调用");\n  console.log("DEBUG: 参数url:", url);\n  console.log("DEBUG: 参数req存在:", !!req);'
    );
    
    content = content.replace(
      'const baseUrl = process.env.BASE_URL || \'http://localhost:3000\';',
      'const baseUrl = process.env.BASE_URL || \'http://localhost:3000\';\n  console.log("DEBUG: 计算的baseUrl:", baseUrl);'
    );
    
    fs.writeFileSync(controllerPath, content, 'utf8');
    console.log('✓ 已添加调试日志到uiController.js');
  } else {
    console.log('✓ 控制器已有调试日志');
  }
}

// 运行调试
async function runDebug() {
  testEnsureFullUrl();
  await addDebugLogs();
  console.log('\n=== 调试完成 ===');
  console.log('请重启服务器后运行测试脚本查看调试日志');
}

runDebug();