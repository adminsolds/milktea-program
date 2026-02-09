# 字体文件说明

此目录用于存放小程序自定义字体文件。

## 白无常可可体 (BWNW Cocoa)

请将字体文件放置在此目录下，支持以下格式（按优先级排序）：

1. **BWNW-Cocoa.woff2** （推荐）- 文件最小，加载最快
2. **BWNW-Cocoa.woff** - 兼容性好
3. **BWNW-Cocoa.ttf** - 最常见格式

## 当前状态

⚠️ **字体文件尚未放置**

小程序会按以下顺序尝试加载：
1. BWNW-Cocoa.woff2
2. BWNW-Cocoa.woff
3. BWNW-Cocoa.ttf

如果所有格式都加载失败，会使用系统回退字体（苹方、PingFang SC等）。

## 字体文件获取方式

### 方式1：官方下载（推荐）
1. 访问白无常可可体的官方网站或授权渠道
2. 下载 WOFF2、WOFF 或 TTF 格式的字体文件

### 方式2：格式转换
如果您有其他格式的字体文件（如OTF），可以使用在线工具转换：

#### WOFF2 转换工具
- **CloudConvert**: https://cloudconvert.com/otf-to-woff2
- **Online Font Converter**: https://onlinefontconverter.com/
- **Everything Fonts**: https://everythingfonts.com/otf-to-woff2

#### 转换步骤
1. 上传您的字体文件（OTF/TTF）
2. 选择输出格式为 WOFF2
3. 下载转换后的文件
4. 重命名为 `BWNW-Cocoa.woff2`
5. 放入此目录

### 方式3：使用CDN（可选）
如果您有可用的CDN链接，可以修改 `app.js` 中的字体加载逻辑。

## 验证字体文件

### 方法1：通过浏览器测试
访问 `http://localhost:3000/fonts/font-test.html` 查看字体加载状态

### 方法2：通过小程序控制台
小程序启动后，查看控制台日志：
- ✅ 成功：`✅ 白无常可可体加载成功 (woff2)`
- ❌ 失败：`❌ 所有字体格式加载失败，使用系统回退字体`

### 方法3：使用测试工具
在小程序中使用字体测试工具：
```javascript
// 在app.js中已集成，查看控制台输出即可
// 或在页面中调用：
const fontTest = require('../../utils/font-test')
fontTest.runFullTest()
```

## 文件要求

| 属性 | 要求 | 说明 |
|------|------|------|
| **格式** | WOFF2（推荐）、WOFF、TTF | 小程序支持这三种格式 |
| **命名** | BWNW-Cocoa.扩展名 | 必须严格匹配，区分大小写 |
| **大小** | 建议 < 5MB | 小程序网络请求限制10MB |
| **编码** | Unicode | 必须包含中文字符 |

## CORS配置

✅ 后端Express服务器已自动配置：
- 第31行：`app.use(cors())` - 允许跨域
- 第35行：`app.use('/fonts', ...)` - 静态文件服务

无需额外配置CORS。

## 故障排查

### 问题1：字体加载失败
**检查项：**
- [ ] 字体文件是否存在于 `backend/public/fonts/` 目录
- [ ] 文件名是否正确（区分大小写）
- [ ] 后端服务器是否正常运行（http://localhost:3000）
- [ ] 控制台是否有错误信息

**解决方法：**
```bash
# 检查文件是否存在
ls backend/public/fonts/BWNW-Cocoa.woff2

# 测试访问
curl -I http://localhost:3000/fonts/BWNW-Cocoa.woff2
```

### 问题2：字体文件过大
**解决方法：**
使用字体子集化工具，只保留需要的汉字：

推荐工具：
- **font_subset**: https://github.com/fonttools/fonttools
- **字扒**: https://github.com/StellarCN/scp_zh
- **在线工具**: https://ezgif.com/png-to-font-subset

### 问题3：字体显示不正常
**可能原因：**
- 字体文件损坏
- 字体文件不包含中文字符
- 网络加载超时

**解决方法：**
1. 重新下载字体文件
2. 检查字体文件完整性
3. 压缩字体文件大小

## 技术细节

### 字体加载流程
1. 小程序启动 (`app.js` onLaunch)
2. 调用 `loadCustomFont()` 方法
3. 按优先级尝试加载 woff2 → woff → ttf
4. 加载成功后全局生效 (`global: true`)
5. 所有页面使用 `BWNW-Cocoa` 字体

### 字体回退链
```css
font-family: "BWNW-Cocoa",
             "白无常可可体",
             "站酷快乐体",
             "快乐体",
             "PingFang SC",
             "苹方",
             "手写体",
             "cursive",
             sans-serif;
```

如果 `BWNW-Cocoa` 加载失败，会自动使用后续的回退字体。

## 相关文件

| 文件 | 说明 | 关键代码 |
|------|------|----------|
| `app.js` | 字体加载逻辑 | 第128-163行 `loadCustomFont()` |
| `backend/app.js` | 静态文件服务 | 第35行 `/fonts` 路由 |
| `pages/detail/detail.wxss` | 字体应用 | 所有 `font-family` 声明 |
| `utils/font-test.js` | 测试工具 | 字体加载检测 |

## 更新日志

- 2025-01-22: 初始化字体加载系统
- 支持多格式自动回退 (woff2 → woff → ttf)
- 添加字体测试工具和页面

