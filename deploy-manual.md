# 手动部署步骤

由于 PowerShell 脚本在 Windows 上运行有问题，请按以下步骤手动部署到服务器：

## 步骤 1：在本地打包代码

```bash
# 在项目根目录执行
cd F:\奶茶店小程序\后台\backend

# 创建部署包
Compress-Archive -Path "public\js\webusb-printer.js", "views\pos.ejs", "docs\webusb-print-guide.md", "local-print-server\*" -DestinationPath "webusb-deploy.zip" -Force
```

## 步骤 2：使用 XFTP 上传到服务器

1. 打开 XFTP
2. 连接到服务器：39.102.214.230
3. 用户名：root，密码：Sage5568
4. 将 `webusb-deploy.zip` 上传到 `/opt/milktea-backend/` 目录

## 步骤 3：在服务器上解压并部署

通过 XShell 连接到服务器，执行以下命令：

```bash
# 进入项目目录
cd /opt/milktea-backend

# 备份现有文件
cp views/pos.ejs views/pos.ejs.backup

# 解压部署包
unzip -o webusb-deploy.zip

# 创建必要的目录
mkdir -p public/js
mkdir -p docs
mkdir -p local-print-server

# 移动文件到正确位置
mv webusb-printer.js public/js/
mv webusb-print-guide.md docs/
mv package.json server.js start.bat README.md local-print-server/ 2>/dev/null || true

# 重启服务
pm2 restart milktea-backend

# 检查服务状态
pm2 status
```

## 步骤 4：验证部署

1. 访问 http://39.102.214.230:3000/admin/pos
2. 打开浏览器开发者工具（F12）
3. 检查控制台是否有 WebUSB 相关日志
4. 尝试下单，查看是否能正常打印

## 文件清单

部署包含以下文件：
- `public/js/webusb-printer.js` - WebUSB 打印机库
- `views/pos.ejs` - 更新后的现场点单页面
- `docs/webusb-print-guide.md` - 使用文档
- `local-print-server/package.json` - 本地打印服务配置
- `local-print-server/server.js` - 本地打印服务主程序
- `local-print-server/start.bat` - Windows 启动脚本
- `local-print-server/README.md` - 本地打印服务文档
