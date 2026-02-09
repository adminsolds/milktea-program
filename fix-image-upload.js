// 修复轮播图上传功能的脚本
const fs = require('fs');
const path = require('path');

// 读取ui.ejs文件
const uiFilePath = path.join(__dirname, 'views', 'ui.ejs');
let content = fs.readFileSync(uiFilePath, 'utf8');

// 修复1: 为URL输入框添加实时预览功能
const initBannerUploadPattern = /function initBannerUpload\(\)\s*\{[\s\S]*?\}/g;
const initBannerUploadMatch = content.match(initBannerUploadPattern);

if (initBannerUploadMatch) {
    const newInitBannerUpload = `function initBannerUpload() {
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
    
    content = content.replace(initBannerUploadPattern, newInitBannerUpload);
    console.log('修复1: 已添加URL输入框实时预览功能');
}

// 修复2: 优化图片上传错误处理
const handleBannerImageUploadPattern = /async function handleBannerImageUpload\(file\)\s*\{[\s\S]*?\}/g;
const handleBannerImageUploadMatch = content.match(handleBannerImageUploadPattern);

if (handleBannerImageUploadMatch) {
    const newHandleBannerImageUpload = `async function handleBannerImageUpload(file) {
            if (!file.type.startsWith('image/')) {
                showToast('请上传图片文件', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showToast('图片大小不能超过5MB', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('image', file);
            
            try {
                showToast('图片上传中...', 'info');
                const response = await fetch('/api/upload/image', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('bannerImage').value = data.url;
                    showBannerImagePreview(data.url);
                    showToast('图片上传成功', 'success');
                } else {
                    const errorData = await response.json();
                    showToast(errorData.error || '图片上传失败', 'error');
                }
            } catch (error) {
                console.error('图片上传失败:', error);
                showToast('图片上传失败，请稍后重试', 'error');
            }
        }`;
    
    content = content.replace(handleBannerImageUploadPattern, newHandleBannerImageUpload);
    console.log('修复2: 已优化图片上传错误处理');
}

// 修复3: 完善预览图片URL函数
const previewImageUrlPattern = /function previewImageUrl\(\)\s*\{[\s\S]*?\}/g;
const previewImageUrlMatch = content.match(previewImageUrlPattern);

if (previewImageUrlMatch) {
    const newPreviewImageUrl = `function previewImageUrl() {
            const url = document.getElementById('bannerImage').value.trim();
            if (url) {
                showBannerImagePreview(url);
                showToast('图片预览成功', 'success');
            } else {
                showToast('请输入图片URL', 'warning');
            }
        }`;
    
    content = content.replace(previewImageUrlPattern, newPreviewImageUrl);
    console.log('修复3: 已完善预览图片URL函数');
}

// 修复4: 增强图片预览显示逻辑
const showBannerImagePreviewPattern = /function showBannerImagePreview\(url\)\s*\{[\s\S]*?\}/g;
const showBannerImagePreviewMatch = content.match(showBannerImagePreviewPattern);

if (showBannerImagePreviewMatch) {
    const newShowBannerImagePreview = `function showBannerImagePreview(url) {
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
    
    content = content.replace(showBannerImagePreviewPattern, newShowBannerImagePreview);
    console.log('修复4: 已增强图片预览显示逻辑');
}

// 保存修改后的文件
fs.writeFileSync(uiFilePath, content, 'utf8');
console.log('所有修复已完成！轮播图上传和预览功能已修复。');

// 重启服务器提示
console.log('\n请重启后端服务器以应用所有更改：');
console.log('node app.js');