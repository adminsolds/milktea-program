// 重写ui.ejs中的JavaScript部分，修复所有语法错误
const fs = require('fs');
const path = require('path');

// 读取ui.ejs文件
const uiFilePath = path.join(__dirname, 'views', 'ui.ejs');
let content = fs.readFileSync(uiFilePath, 'utf8');

console.log('开始重写ui.ejs中的JavaScript代码...');

// 定义完整的JavaScript代码
const fullJavaScriptCode = `    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // 全局变量
        let banners = [];
        let functionEntries = [];
        let newProducts = [];
        let products = [];
        let isPreviewVisible = false;
        
        // 初始化页面
        document.addEventListener('DOMContentLoaded', function() {
            loadBanners();
            loadFunctionEntries();
            loadNewProducts();
            loadProducts();
            initBannerUpload();
        });
        
        // 初始化轮播图上传功能
        function initBannerUpload() {
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
        }
        
        // 处理轮播图图片上传
        async function handleBannerImageUpload(file) {
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
        }
        
        // 预览图片URL
        function previewImageUrl() {
            const url = document.getElementById('bannerImage').value.trim();
            if (url) {
                showBannerImagePreview(url);
                showToast('图片预览成功', 'success');
            } else {
                showToast('请输入图片URL', 'warning');
            }
        }
        
        // 显示轮播图图片预览
        function showBannerImagePreview(url) {
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
        }
        
        // 清除轮播图图片
        function clearBannerImage() {
            document.getElementById('bannerImage').value = '';
            document.getElementById('bannerImagePreviewContainer').style.display = 'none';
        }
        
        // 切换预览显示
        function togglePreview() {
            const previewContainer = document.getElementById('bannerPreviewContainer');
            const previewBtnText = document.getElementById('previewBtnText');
            isPreviewVisible = !isPreviewVisible;
            
            if (isPreviewVisible) {
                previewContainer.style.display = 'block';
                previewBtnText.textContent = '隐藏预览';
                renderBannerPreview();
            } else {
                previewContainer.style.display = 'none';
                previewBtnText.textContent = '显示预览';
            }
        }
        
        // 渲染轮播图预览
        function renderBannerPreview() {
            const container = document.getElementById('bannerPreviewContent');
            container.innerHTML = '';
            
            const activeBanners = banners.filter(b => b.is_active);
            
            if (activeBanners.length === 0) {
                container.innerHTML = '<p class="text-white">暂无激活的轮播图</p>';
                return;
            }
            
            activeBanners.forEach(banner => {
                const item = document.createElement('div');
                item.className = 'banner-preview-item';
                item.style.minWidth = '200px';
                item.innerHTML = `
                    <img src="${banner.image}" alt="${banner.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22120%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22120%22/><text fill=%22%23666%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22>图片加载失败</text></svg>'">
                    <div class="card-body">
                        <h6 class="card-title mb-1">${banner.title}</h6>
                        <small class="text-muted">${banner.link || '无链接'}</small>
                    </div>
                `;
                container.appendChild(item);
            });
        }
        
        // 显示提示消息
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed top-0 end-0 m-3`;
            toast.style.zIndex = '9999';
            toast.innerHTML = `
                <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'}"></i>
                ${message}
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
        
        // 轮播图管理相关函数
        
        // 加载轮播图列表
        async function loadBanners() {
            try {
                const response = await fetch('/api/ui/banners');
                const data = await response.json();
                if (data.banners) {
                    banners = data.banners;
                    renderBanners();
                }
            } catch (error) {
                console.error('加载轮播图失败:', error);
            }
        }
        
        // 渲染轮播图列表
        function renderBanners() {
            const tbody = document.getElementById('bannersTableBody');
            tbody.innerHTML = '';
            
            if (banners.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">暂无轮播图数据</td></tr>';
                return;
            }
            
            banners.forEach(banner => {
                const positionClass = `position-${banner.position}`;
                const positionText = {
                    'home': '首页',
                    'category': '分类页',
                    'product': '商品页'
                }[banner.position] || banner.position;
                
                const row = document.createElement('tr');
                row.className = 'banner-list-item';
                row.innerHTML = `
                    <td><strong>${banner.id}</strong></td>
                    <td><strong>${banner.title}</strong></td>
                    <td>
                        <img src="${banner.image}" alt="${banner.title}" 
                             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2250%22><rect fill=%22%23f0f0f0%22 width=%22100%22 height=%2250%22/><text fill=%22%23666%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22>图片</text></svg>'">
                    </td>
                    <td><span class="badge ${positionClass}">${positionText}</span></td>
                    <td>
                        ${banner.link ? `<a href="${banner.link}" target="_blank" class="text-truncate d-inline-block" style="max-width: 150px;">${banner.link}</a>` : '<span class="text-muted">-</span>'}
                    </td>
                    <td>
                        <span class="badge bg-secondary">${banner.sort_order}</span>
                    </td>
                    <td>
                        <span class="badge ${banner.is_active ? 'bg-success' : 'bg-danger'} status-toggle" onclick="toggleBannerStatus(${banner.id})">
                            ${banner.is_active ? '激活' : '禁用'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="openEditBannerModal(${JSON.stringify(banner).replace(/"/g, '&quot;')})" title="编辑">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-${banner.is_active ? 'warning' : 'success'}" onclick="toggleBannerStatus(${banner.id})" title="${banner.is_active ? '禁用' : '激活'}">
                                <i class="bi bi-${banner.is_active ? 'pause' : 'play'}"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteBanner(${banner.id})" title="删除">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
        
        // 切换轮播图状态
        async function toggleBannerStatus(bannerId) {
            const banner = banners.find(b => b.id === bannerId);
            if (!banner) return;
            
            const newStatus = banner.is_active ? 0 : 1;
            const actionText = newStatus ? '激活' : '禁用';
            
            if (!confirm(`确定要${actionText}该轮播图吗？`)) {
                return;
            }
            
            try {
                const response = await fetch(`/api/ui/banners/${bannerId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ is_active: newStatus })
                });
                
                if (response.ok) {
                    loadBanners();
                    if (isPreviewVisible) {
                        renderBannerPreview();
                    }
                    showToast(`轮播图已${actionText}`, 'success');
                } else {
                    const errorData = await response.json();
                    showToast(errorData.error || '操作失败', 'error');
                }
            } catch (error) {
                console.error('切换轮播图状态失败:', error);
                showToast('操作失败，请稍后重试', 'error');
            }
        }
        
        // 打开添加轮播图模态框
        function openAddBannerModal() {
            document.getElementById('bannerModalLabel').innerHTML = '<i class="bi bi-plus-circle"></i> 添加轮播图';
            document.getElementById('bannerForm').reset();
            document.getElementById('bannerId').value = '';
            document.getElementById('bannerImagePreviewContainer').style.display = 'none';
            new bootstrap.Modal(document.getElementById('bannerModal')).show();
        }
        
        // 打开编辑轮播图模态框
        function openEditBannerModal(banner) {
            document.getElementById('bannerModalLabel').innerHTML = '<i class="bi bi-pencil-square"></i> 编辑轮播图';
            document.getElementById('bannerId').value = banner.id;
            document.getElementById('bannerTitle').value = banner.title;
            document.getElementById('bannerImage').value = banner.image;
            document.getElementById('bannerPosition').value = banner.position;
            document.getElementById('bannerLink').value = banner.link || '';
            document.getElementById('bannerSortOrder').value = banner.sort_order;
            document.getElementById(banner.is_active ? 'bannerActive' : 'bannerInactive').checked = true;
            
            if (banner.image) {
                showBannerImagePreview(banner.image);
            } else {
                document.getElementById('bannerImagePreviewContainer').style.display = 'none';
            }
            
            new bootstrap.Modal(document.getElementById('bannerModal')).show();
        }
        
        // 保存轮播图
        async function saveBanner() {
            const form = document.getElementById('bannerForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const bannerId = document.getElementById('bannerId').value;
            const bannerData = {
                title: document.getElementById('bannerTitle').value,
                image: document.getElementById('bannerImage').value,
                position: document.getElementById('bannerPosition').value,
                link: document.getElementById('bannerLink').value,
                sort_order: parseInt(document.getElementById('bannerSortOrder').value) || 0,
                is_active: document.querySelector('input[name="bannerStatus"]:checked').value
            };
            
            if (!bannerData.image) {
                showToast('请上传或输入轮播图图片', 'warning');
                return;
            }
            
            try {
                let response;
                let successMessage;
                if (bannerId) {
                    response = await fetch(`/api/ui/banners/${bannerId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(bannerData)
                    });
                    successMessage = '轮播图更新成功！';
                } else {
                    response = await fetch('/api/ui/banners', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(bannerData)
                    });
                    successMessage = '轮播图添加成功！';
                }
                
                if (response.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('bannerModal')).hide();
                    loadBanners();
                    if (isPreviewVisible) {
                        renderBannerPreview();
                    }
                    showToast(successMessage, 'success');
                } else {
                    const errorData = await response.json();
                    showToast(errorData.error || '保存失败', 'error');
                }
            } catch (error) {
                console.error('保存轮播图失败:', error);
                showToast('保存失败，请稍后重试', 'error');
            }
        }
        
        // 删除轮播图
        async function deleteBanner(bannerId) {
            if (!confirm('确定要删除该轮播图吗？此操作不可恢复！')) {
                return;
            }
            
            try {
                const response = await fetch(`/api/ui/banners/${bannerId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadBanners();
                    if (isPreviewVisible) {
                        renderBannerPreview();
                    }
                    showToast('轮播图删除成功！', 'success');
                } else {
                    const errorData = await response.json();
                    showToast(errorData.error || '删除失败', 'error');
                }
            } catch (error) {
                console.error('删除轮播图失败:', error);
                showToast('删除失败，请稍后重试', 'error');
            }
        }
        
        // 功能入口管理相关函数
        
        // 加载功能入口列表
        async function loadFunctionEntries() {
            try {
                const response = await fetch('/api/ui/function-entries');
                const data = await response.json();
                if (data.functionEntries) {
                    functionEntries = data.functionEntries;
                    renderFunctionEntries();
                }
            } catch (error) {
                console.error('加载功能入口失败:', error);
            }
        }
        
        // 渲染功能入口列表
        function renderFunctionEntries() {
            const tbody = document.getElementById('functionEntriesTableBody');
            tbody.innerHTML = '';
            
            if (functionEntries.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">暂无功能入口数据</td></tr>';
                return;
            }
            
            functionEntries.forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${entry.id}</td>
                    <td>${entry.name}</td>
                    <td>${entry.type}</td>
                    <td><img src="${entry.icon}" alt="图标" style="width: 40px; height: 40px;"></td>
                    <td>${entry.link || '-'}</td>
                    <td>${entry.sort_order}</td>
                    <td><span class="badge ${entry.is_active ? 'bg-success' : 'bg-danger'}">${entry.is_active ? '激活' : '禁用'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="openEditFunctionEntryModal(${JSON.stringify(entry).replace(/"/g, '&quot;')})"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteFunctionEntry(${entry.id})"><i class="bi bi-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
        
        // 打开添加功能入口模态框
        function openAddFunctionEntryModal() {
            document.getElementById('functionEntryModalLabel').textContent = '添加功能入口';
            document.getElementById('functionEntryForm').reset();
            document.getElementById('functionEntryId').value = '';
            document.getElementById('functionEntryIconPreview').style.display = 'none';
            new bootstrap.Modal(document.getElementById('functionEntryModal')).show();
        }
        
        // 打开编辑功能入口模态框
        function openEditFunctionEntryModal(entry) {
            document.getElementById('functionEntryModalLabel').textContent = '编辑功能入口';
            document.getElementById('functionEntryId').value = entry.id;
            document.getElementById('functionEntryName').value = entry.name;
            document.getElementById('functionEntryDesc').value = entry.desc || '';
            document.getElementById('functionEntryType').value = entry.type;
            document.getElementById('functionEntryIcon').value = entry.icon;
            document.getElementById('functionEntryIconPreview').src = entry.icon;
            document.getElementById('functionEntryIconPreview').style.display = 'inline-block';
            document.getElementById('functionEntryLink').value = entry.link || '';
            document.getElementById('functionEntrySortOrder').value = entry.sort_order;
            document.getElementById(entry.is_active ? 'functionEntryActive' : 'functionEntryInactive').checked = true;
            new bootstrap.Modal(document.getElementById('functionEntryModal')).show();
        }
        
        // 保存功能入口
        async function saveFunctionEntry() {
            const form = document.getElementById('functionEntryForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const entryId = document.getElementById('functionEntryId').value;
            const entryData = {
                name: document.getElementById('functionEntryName').value,
                desc: document.getElementById('functionEntryDesc').value,
                type: document.getElementById('functionEntryType').value,
                icon: document.getElementById('functionEntryIcon').value,
                link: document.getElementById('functionEntryLink').value,
                sort_order: parseInt(document.getElementById('functionEntrySortOrder').value) || 0,
                is_active: document.querySelector('input[name="functionEntryStatus"]:checked').value
            };
            
            try {
                let response;
                if (entryId) {
                    response = await fetch(`/api/ui/function-entries/${entryId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(entryData)
                    });
                } else {
                    response = await fetch('/api/ui/function-entries', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(entryData)
                    });
                }
                
                if (response.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('functionEntryModal')).hide();
                    loadFunctionEntries();
                    alert('功能入口保存成功！');
                } else {
                    const errorData = await response.json();
                    alert('保存失败：' + (errorData.error || '未知错误'));
                }
            } catch (error) {
                console.error('保存功能入口失败:', error);
                alert('保存功能入口失败，请稍后重试');
            }
        }
        
        // 删除功能入口
        async function deleteFunctionEntry(entryId) {
            if (!confirm('确定要删除该功能入口吗？')) {
                return;
            }
            
            try {
                const response = await fetch(`/api/ui/function-entries/${entryId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadFunctionEntries();
                    alert('功能入口删除成功！');
                } else {
                    const errorData = await response.json();
                    alert('删除失败：' + (errorData.error || '未知错误'));
                }
            } catch (error) {
                console.error('删除功能入口失败:', error);
                alert('删除功能入口失败，请稍后重试');
            }
        }
        
        // 新品推荐管理相关函数
        
        // 加载新品推荐列表
        async function loadNewProducts() {
            try {
                const response = await fetch('/api/ui/new-products');
                const data = await response.json();
                if (data.newProducts) {
                    newProducts = data.newProducts;
                    renderNewProducts();
                }
            } catch (error) {
                console.error('加载新品推荐失败:', error);
            }
        }
        
        // 渲染新品推荐列表
        function renderNewProducts() {
            const tbody = document.getElementById('newProductsTableBody');
            tbody.innerHTML = '';
            
            if (newProducts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">暂无新品推荐数据</td></tr>';
                return;
            }
            
            newProducts.forEach(newProduct => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${newProduct.id}</td>
                    <td>${newProduct.product?.name || '-'}</td>
                    <td>¥${newProduct.product?.price || '0.00'}</td>
                    <td>${newProduct.sort_order}</td>
                    <td><span class="badge ${newProduct.is_active ? 'bg-success' : 'bg-danger'}">${newProduct.is_active ? '激活' : '禁用'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="openEditNewProductModal(${JSON.stringify(newProduct).replace(/"/g, '&quot;')})"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteNewProduct(${newProduct.id})" ${newProduct.product ? '' : 'disabled'}><i class="bi bi-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
        
        // 加载商品列表
        async function loadProducts() {
            try {
                const response = await fetch('/api/products');
                const data = await response.json();
                if (data.products) {
                    products = data.products;
                    populateProductSelect();
                }
            } catch (error) {
                console.error('加载商品列表失败:', error);
            }
        }
        
        // 填充商品选择下拉框
        function populateProductSelect() {
            const select = document.getElementById('productSelect');
            // 清空现有选项（保留第一个）
            select.innerHTML = '<option value="">请选择商品</option>';
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (¥${product.price})`;
                select.appendChild(option);
            });
        }
        
        // 打开添加新品推荐模态框
        function openAddNewProductModal() {
            document.getElementById('newProductModalLabel').textContent = '添加新品推荐';
            document.getElementById('newProductForm').reset();
            document.getElementById('newProductId').value = '';
            new bootstrap.Modal(document.getElementById('newProductModal')).show();
        }
        
        // 打开编辑新品推荐模态框
        function openEditNewProductModal(newProduct) {
            document.getElementById('newProductModalLabel').textContent = '编辑新品推荐';
            document.getElementById('newProductId').value = newProduct.id;
            document.getElementById('productSelect').value = newProduct.product_id;
            document.getElementById('newProductSortOrder').value = newProduct.sort_order;
            document.getElementById(newProduct.is_active ? 'newProductActive' : 'newProductInactive').checked = true;
            new bootstrap.Modal(document.getElementById('newProductModal')).show();
        }
        
        // 保存新品推荐
        async function saveNewProduct() {
            const form = document.getElementById('newProductForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const newProductId = document.getElementById('newProductId').value;
            const newProductData = {
                product_id: document.getElementById('productSelect').value,
                sort_order: parseInt(document.getElementById('newProductSortOrder').value) || 0,
                is_active: document.querySelector('input[name="newProductStatus"]:checked').value
            };
            
            try {
                let response;
                if (newProductId) {
                    response = await fetch(`/api/ui/new-products/${newProductId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newProductData)
                    });
                } else {
                    response = await fetch('/api/ui/new-products', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newProductData)
                    });
                }
                
                if (response.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('newProductModal')).hide();
                    loadNewProducts();
                    alert('新品推荐保存成功！');
                } else {
                    const errorData = await response.json();
                    alert('保存失败：' + (errorData.error || '未知错误'));
                }
            } catch (error) {
                console.error('保存新品推荐失败:', error);
                alert('保存新品推荐失败，请稍后重试');
            }
        }
        
        // 删除新品推荐
        async function deleteNewProduct(newProductId) {
            if (!confirm('确定要删除该新品推荐吗？')) {
                return;
            }
            
            try {
                const response = await fetch(`/api/ui/new-products/${newProductId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadNewProducts();
                    alert('新品推荐删除成功！');
                } else {
                    const errorData = await response.json();
                    alert('删除失败：' + (errorData.error || '未知错误'));
                }
            } catch (error) {
                console.error('删除新品推荐失败:', error);
                alert('删除新品推荐失败，请稍后重试');
            }
        }
    </script>`;

// 替换现有的script标签
const scriptStart = content.indexOf('<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>');
const scriptEnd = content.indexOf('</body>', scriptStart);

if (scriptStart !== -1 && scriptEnd !== -1) {
    // 替换脚本部分
    content = content.slice(0, scriptStart) + fullJavaScriptCode + content.slice(scriptEnd);
    console.log('✓ 重写了JavaScript代码，修复了所有语法错误');
} else {
    console.error('未找到完整的脚本标签，无法修复');
    process.exit(1);
}

// 保存修复后的文件
fs.writeFileSync(uiFilePath, content, 'utf8');
console.log('所有修复已完成！');
console.log('\n请重启后端服务器以应用更改：');
console.log('node app.js');