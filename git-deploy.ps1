# Git 部署脚本
# 将本地代码推送到服务器

$serverIp = "39.102.214.230"
$serverUser = "root"
$remotePath = "/opt/milktea-backend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Git 部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Git 状态
Write-Host "1. 检查 Git 状态..." -ForegroundColor Yellow
cd "F:\奶茶店小程序\后台\backend"
$status = git status --short
if ($status) {
    Write-Host "   有未提交的更改，请先提交:" -ForegroundColor Red
    Write-Host $status -ForegroundColor Gray
    Write-Host ""
    $commit = Read-Host "是否自动提交更改? (y/n)"
    if ($commit -eq "y") {
        git add .
        $msg = Read-Host "输入提交信息"
        git commit -m "$msg"
    } else {
        exit
    }
} else {
    Write-Host "   ✓ 工作区干净" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. 推送到服务器..." -ForegroundColor Yellow

# 检查是否有远程仓库
$remote = git remote -v
if (-not $remote) {
    Write-Host "   未配置远程仓库，请先在服务器上配置 Git" -ForegroundColor Red
    Write-Host ""
    Write-Host "   服务器配置步骤:" -ForegroundColor Yellow
    Write-Host "   1. ssh $serverUser@$serverIp" -ForegroundColor Gray
    Write-Host "   2. cd $remotePath" -ForegroundColor Gray
    Write-Host "   3. git init" -ForegroundColor Gray
    Write-Host "   4. git config receive.denyCurrentBranch ignore" -ForegroundColor Gray
    Write-Host ""
    exit
}

# 推送到服务器
try {
    git push origin main
    Write-Host "   ✓ 推送成功" -ForegroundColor Green
} catch {
    Write-Host "   ✗ 推送失败: $_" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "3. 在服务器上部署..." -ForegroundColor Yellow

# SSH 到服务器执行部署命令
$commands = @"
cd $remotePath
git checkout -f main
npm install
pm2 restart milktea-backend
"@

try {
    $commands | ssh ${serverUser}@${serverIp}
    Write-Host "   ✓ 部署成功" -ForegroundColor Green
} catch {
    Write-Host "   ✗ 部署失败: $_" -ForegroundColor Red
    Write-Host "   请手动登录服务器执行:" -ForegroundColor Yellow
    Write-Host "   ssh ${serverUser}@${serverIp}" -ForegroundColor Gray
    Write-Host "   cd $remotePath && git pull && npm install && pm2 restart milktea-backend" -ForegroundColor Gray
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
    }
} catch {
    Write-Host "   ✗ 线上服务测试失败: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "按回车键退出"
