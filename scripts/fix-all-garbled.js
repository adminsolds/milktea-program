/**
 * 修复 products.ejs 文件的所有乱码字符
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../views/products.ejs');

// 读取文件
let content = fs.readFileSync(filePath, 'utf-8');

// 定义所有需要修复的乱码
const replacements = [
  // HTML 标签和文本
  ['优惠券管是', '优惠券管理'],
  ['储值管是', '储值管理'],
  ['退出登是', '退出登录'],
  ['欢迎是', '欢迎，'],
  ['所有分是', '所有分类'],
  ['销是', '销量'],
  ['状是', '状态'],
  ['记录，是', '记录，共'],
  ['是/div>', '</div>'],
  ['图标URL或点击上是', '图标URL或点击上传'],
  ['图片URL或点击上是', '图片URL或点击上传'],
  ['热是推荐', '热门推荐'],
  ['是/label>', '</label>'],
  ['商品状是', '商品状态'],
  ['设置是', '设置'],
  ['是/small>', '</small>'],
  ['所有分是/option>', '所有分类</option>'],

  // JavaScript 注释和代码
  ['只允许上是', '只允许上传'],
  ['类型的图是', '类型的图片'],
  ['检查文件大小（5MB是', '检查文件大小（5MB）'],
  ['设置图是URL', '设置图片URL'],
  ['获取认证是', '获取认证头'],
  ['删除后该分类下的商品将无法正常显示是)', '删除后该分类下的商品将无法正常显示。）'],
  ['添加认证是', '添加认证头'],
  ['删除失败：该分类下存在商品，请先将商品转移到其他分类或删除商品后再尝试删除分是;', '删除失败：该分类下存在商品，请先将商品转移到其他分类或删除商品后再尝试删除分类；'],
  ['冰度和甜度默认启是', '冰度和甜度默认启用'],
];

let fixedCount = 0;

replacements.forEach(([pattern, replacement]) => {
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
