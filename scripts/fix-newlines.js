/**
 * 修复 products.ejs 文件的换行问题
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../views/products.ejs');

// 读取文件
let content = fs.readFileSync(filePath, 'utf-8');

// 修复 "是" 后面缺少换行的问题
// 匹配模式: // ...是    const|let|var|function|document|if|for|while|return
const patterns = [
  // 填充分类选择是
  [/\/\/ 填充分类选择是\s+const/g, '// 填充分类选择器\n                const'],
  // 确保price是数字类型
  [/\/\/ 确保price是数字类是\s+const/g, '// 确保price是数字类型\n                const'],
  // 上一页按钮
  [/\/\/ 上一页按是\s+const/g, '// 上一页按钮\n            const'],
  // 下一页按钮
  [/\/\/ 下一页按是\s+const/g, '// 下一页按钮\n            const'],
  // 检查文件类型
  [/\/\/ 检查文件类是\s+const/g, '// 检查文件类型\n            const'],
  // 合并所有规格
  [/\/\/ 合并所有规是\s+const/g, '// 合并所有规格\n            const'],
];

let fixedCount = 0;

patterns.forEach(([pattern, replacement]) => {
  const matches = content.match(pattern);
  if (matches) {
    fixedCount += matches.length;
    content = content.replace(pattern, replacement);
  }
});

// 写回文件
fs.writeFileSync(filePath, content, 'utf-8');

console.log(`修复完成！共修复 ${fixedCount} 处换行问题。`);
