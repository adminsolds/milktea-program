// 修复JavaScript语法错误的脚本
const fs = require('fs');
const path = require('path');

// 读取ui.ejs文件
const uiFilePath = path.join(__dirname, 'views', 'ui.ejs');
let content = fs.readFileSync(uiFilePath, 'utf8');

// 查找并修复showBannerImagePreview函数的语法错误
// 先找到函数的开始位置
const functionStartIndex = content.indexOf('function showBannerImagePreview(url) {');
if (functionStartIndex === -1) {
    console.error('未找到showBannerImagePreview函数');
    process.exit(1);
}

// 修复方法：完全替换掉有问题的函数
const newFunctionCode = `        function showBannerImagePreview(url) {
            const previewContainer = document.getElementById('bannerImagePreviewContainer');
            const preview = document.getElementById('bannerImagePreview');
            
            if (url) {
                preview.src = url;
                preview.style.display = 'block';
                previewContainer.style.display = 'block';
                
                // 图片加载成功处理
                preview.onload = () => {
                    console.log('图片加载成功:', url);
                };
                
                // 图片加载失败处理
                preview.onerror = () => {
                    console.error('图片加载失败:', url);
                    // 显示默认占位图
                    preview.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="#f0f0f0" width="200" height="150"/><text fill="#666" x="50%" y="50%" text-anchor="middle">图片加载失败</text></svg>';
                };
            } else {
                previewContainer.style.display = 'none';
            }
        }`;

// 找到函数的结束位置（查找下一个函数或主要代码块）
const nextFunctionMatch = content.slice(functionStartIndex).match(/function\s+\w+\s*\(|\}\s*$|const\s+\w+\s*=/);
let functionEndIndex;
if (nextFunctionMatch) {
    functionEndIndex = functionStartIndex + nextFunctionMatch.index;
} else {
    // 如果没找到，就找到文件末尾
    functionEndIndex = content.length;
}

// 替换有问题的函数
content = content.slice(0, functionStartIndex) + newFunctionCode + content.slice(functionEndIndex);

// 保存修复后的文件
fs.writeFileSync(uiFilePath, content, 'utf8');
console.log('修复完成！showBannerImagePreview函数的语法错误已解决。');
console.log('\n请重启后端服务器以应用更改：');
console.log('node app.js');