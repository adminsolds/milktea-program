# 奶茶店小程序后端部署脚本
# 将本地更新同步到线上服务器

$serverIp = "39.102.214.230"
$serverUser = "root"
$remotePath = "/opt/milktea-backend"
$localPath = "."

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  奶茶店小程序后端部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否有修改的文件
Write-Host "1. 检查本地修改的文件..." -ForegroundColor Yellow

# 需要同步的文件和目录
$syncItems = @(
    "app.js",
    "package.json",
    "config",
    "controllers",
    "middleware",
    "models",
    "routes",
    "utils",
    "views"
)

Write-Host "   将同步以下文件/目录:" -ForegroundColor Gray
foreach ($item in $syncItems) {
    Write-Host "   - $item" -ForegroundColor Gray
}

Write-Host ""
Write-Host "2. 开始上传到服务器 $serverIp..." -ForegroundColor Yellow

# 使用 scp 上传文件
foreach ($item in $syncItems) {
    $localItem = Join-Path $localPath $item
    if (Test-Path $localItem) {
        Write-Host "   上传 $item ..." -ForegroundColor Gray
        try {
            scp -r $localItem "${serverUser}@${serverIp}:${remotePath}/"
            Write-Host "   ✓ $item 上传成功" -ForegroundColor Green
        } catch {
            Write-Host "   ✗ $item 上传失败: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "   ! $item 不存在，跳过" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "3. 在服务器上安装依赖并重启服务..." -ForegroundColor Yellow

# SSH 到服务器执行命令
$sshCommands = @"
cd $remotePath
npm install
pm2 restart milktea-backend
"@

try {
    $sshCommands | ssh ${serverUser}@${serverIp}
    Write-Host "   ✓ 服务重启成功" -ForegroundColor Green
} catch {
    Write-Host "   ✗ 服务重启失败: $_" -ForegroundColor Red
    Write-Host "   请手动登录服务器执行: pm2 restart milktea-backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "线上服务器: http://${serverIp}:3000" -ForegroundColor Cyan
Write-Host ""

# 测试连接
Write-Host "4. 测试线上服务..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${serverIp}:3000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ 线上服务正常" -ForegroundColor Green
        Write-Host "   响应: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ 线上服务测试失败: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "按回车键退出"
