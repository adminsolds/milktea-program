/**
 * 修复 products.ejs 文件的编码问题 - 完整版
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../views/products.ejs');

// 读取文件
let content = fs.readFileSync(filePath, 'utf-8');

// 定义单个乱码字符的替换
const singleCharReplacements = [
  ['系�?', '系统'],
  ['侧边�?', '侧边栏'],
  ['�?', '是'],
  ['�?', '否'],
  ['登�?', '登录'],
  ['导航�?', '导航栏'],
  ['欢迎�?', '欢迎，'],
  ['筛�?', '筛选'],
  ['分�?', '分类'],
  ['加�?', '加载'],
  ['销�?', '销量'],
  ['状�?', '状态'],
  ['激�?', '激活'],
  ['热�?', '热门'],
  ['�?', ''],
  ['生�?', '生成'],
  ['上�?', '上传'],
  ['�?', ''],
  ['描�?', '描述'],
  ['标签�?', '标签页'],
  ['页�?', '页面'],
  ['选择�?', '选择器'],
  ['类�?', '类型'],
  ['按�?', '按钮'],
  ['条�?', '条件'],
  ['开�?', '开关'],
  ['启�?', '启用'],
  ['�?', ''],
  ['图�?', '图片'],
  ['态�?', '状态'],
  ['�?', ''],
  ['认�?', '认证'],
  ['头�?', '头'],
  ['功�?', '成功'],
  ['败�?', '失败'],
  ['示�?', '显示'],
  ['类�?', '类型'],
  ['项�?', '项目'],
  ['格�?', '格'],
  ['规�?', '规格'],
  ['�?', ''],
  ['�?', ''],
  ['�?', '共'],
  ['管�?', '管理'],
  ['储�?', '储值'],
  ['�?', '：'],
];

let fixedCount = 0;

// 处理单个乱码字符替换
singleCharReplacements.forEach(([pattern, replacement]) => {
  const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    fixedCount += matches.length;
    content = content.replace(regex, replacement);
  }
});

// 写回文件
fs.writeFileSync(filePath, content, 'utf-8');

console.log(`修复完成！共修复 ${fixedCount} 处乱码。`);
