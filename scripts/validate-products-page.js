/**
 * 验证 products.ejs 页面是否可以正常解析
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../views/products.ejs');

// 读取文件
const content = fs.readFileSync(filePath, 'utf-8');

console.log('验证 products.ejs 页面...\n');

// 检查关键函数是否存在
const requiredFunctions = [
  'function openAddModal()',
  'function openEditModal(',
  'function saveProduct()',
  'function loadProducts()',
  'function getAuthHeaders()'
];

let allFunctionsFound = true;

console.log('检查关键函数:');
requiredFunctions.forEach(func => {
  const found = content.includes(func);
  console.log(`  ${found ? '✅' : '❌'} ${func}`);
  if (!found) allFunctionsFound = false;
});

// 检查是否还有乱码字符
const hasGarbledChars = /�/.test(content);
console.log(`\n${hasGarbledChars ? '❌' : '✅'} 乱码字符检查`);
if (hasGarbledChars) {
  console.log('  警告: 文件中仍存在乱码字符');
}

// 检查 HTML 结构
const hasDocType = content.includes('<!DOCTYPE html>');
const hasHtmlTag = content.includes('<html');
const hasHeadTag = content.includes('<head>');
const hasBodyTag = content.includes('<body>');
const hasScriptTag = content.includes('<script>');

console.log('\n检查 HTML 结构:');
console.log(`  ${hasDocType ? '✅' : '❌'} DOCTYPE`);
console.log(`  ${hasHtmlTag ? '✅' : '❌'} <html> 标签`);
console.log(`  ${hasHeadTag ? '✅' : '❌'} <head> 标签`);
console.log(`  ${hasBodyTag ? '✅' : '❌'} <body> 标签`);
console.log(`  ${hasScriptTag ? '✅' : '❌'} <script> 标签`);

// 统计文件信息
const lines = content.split('\n').length;
const chars = content.length;

console.log(`\n文件统计:`);
console.log(`  总行数: ${lines}`);
console.log(`  总字符数: ${chars}`);

// 总结
console.log('\n========================================');
if (allFunctionsFound && !hasGarbledChars) {
  console.log('✅ 验证通过！页面应该可以正常加载。');
} else {
  console.log('⚠️ 验证发现问题，请检查上述错误。');
}
console.log('========================================');
