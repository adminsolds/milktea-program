// 修复ui.ejs中的JavaScript语法错误
const fs = require('fs');
const path = require('path');

// 读取ui.ejs文件
const uiFilePath = path.join(__dirname, 'views', 'ui.ejs');
let content = fs.readFileSync(uiFilePath, 'utf8');

console.log('开始修复ui.ejs中的JavaScript语法错误...');

// 1. 修复initBannerUpload函数的语法错误
const initBannerUploadPattern = /function initBannerUpload\(\)\s*\{[\s\S]*?function handleBannerImageUpload/;
const initBannerUploadMatch = content.match(initBannerUploadPattern);

if (initBannerUploadMatch) {
    // 提取并修复initBannerUpload函数
    const brokenFunction = initBannerUploadMatch[0];
    
    // 创建正确的initBannerUpload函数
    const correctInitBannerUpload = `function initBannerUpload() {
            const uploadArea = document.getElementById('bannerUploadArea');
            const fileInput = document.getElementById('bannerImageFile');
            const imageUrlInput = document.getElementById('bannerImage');
            
            if (!uploadArea || !fileInput) return;
            
            uploadArea.addEventListener('click', () => fileInput.click());
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleBannerImageUpload(files[0]);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleBannerImageUpload(e.target.files[0]);
                }
            });
            
            // 添加URL输入框实时预览
            if (imageUrlInput) {
                imageUrlInput.addEventListener('input', () => {
                    const url = imageUrlInput.value.trim();
                    if (url) {
                        showBannerImagePreview(url);
                    } else {
                        document.getElementById('bannerImagePreviewContainer').style.display = 'none';
                    }
                });
            }
        }`;
    
    // 替换损坏的函数
    content = content.replace(brokenFunction, correctInitBannerUpload + 'function handleBannerImageUpload');
    console.log('✓ 修复了initBannerUpload函数的语法错误');
} else {
    console.error('未找到initBannerUpload函数');
}

// 2. 确保所有函数都正确定义
// 检查openAddBannerModal函数是否存在
if (!content.includes('function openAddBannerModal')) {
    // 在适当位置添加openAddBannerModal函数
    const functionStartIndex = content.indexOf('// 打开添加轮播图模态框');
    if (functionStartIndex !== -1) {
        const correctOpenAddBannerModal = `
        // 打开添加轮播图模态框
        function openAddBannerModal() {
            document.getElementById('bannerModalLabel').innerHTML = '<i class="bi bi-plus-circle"></i> 添加轮播图';
            document.getElementById('bannerForm').reset();
            document.getElementById('bannerId').value = '';
            document.getElementById('bannerImagePreviewContainer').style.display = 'none';
            new bootstrap.Modal(document.getElementById('bannerModal')).show();
        }`;
        
        // 找到下一个函数的开始位置
        const nextFunctionIndex = content.indexOf('function', functionStartIndex + 1);
        if (nextFunctionIndex !== -1) {
            content = content.slice(0, nextFunctionIndex) + correctOpenAddBannerModal + content.slice(nextFunctionIndex);
            console.log('✓ 添加了缺失的openAddBannerModal函数');
        }
    }
} else {
    console.log('✓ openAddBannerModal函数已存在');
}

// 3. 修复favicon.ico的404问题
// 在app.js中已经处理了这个问题，所以这里不需要再处理

// 保存修复后的文件
fs.writeFileSync(uiFilePath, content, 'utf8');
console.log('所有修复已完成！');
console.log('\n请重启后端服务器以应用更改：');
console.log('node app.js');