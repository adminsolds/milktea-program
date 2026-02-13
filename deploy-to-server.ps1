# 一键部署脚本 - 将本地代码部署到服务器
# 使用方法: 在 PowerShell 中运行 .\deploy-to-server.ps1

param(
    [string]$ServerIP = "39.102.214.230",
    [string]$ServerUser = "root",
    [string]$RemotePath = "/opt/milktea-backend"
)

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  一键部署脚本" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. 提交本地代码
Write-Host "1. 检查本地代码变更..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "   发现未提交的变更，正在提交..." -ForegroundColor Yellow
    git add -A -- ':!nul'
    git commit -m "Auto deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "   提交完成" -ForegroundColor Green
} else {
    Write-Host "   没有未提交的变更" -ForegroundColor Green
}

# 2. 推送到 GitHub
Write-Host ""
Write-Host "2. 推送代码到 GitHub..." -ForegroundColor Yellow
git push origin main
Write-Host "   推送完成" -ForegroundColor Green

# 3. 部署到服务器
Write-Host ""
Write-Host "3. 部署到服务器..." -ForegroundColor Yellow
Write-Host "   服务器: $ServerIP" -ForegroundColor Gray
Write-Host "   路径: $RemotePath" -ForegroundColor Gray

$deployCommands = @"
cd $RemotePath
pm2 stop milktea-api 2>/dev/null || true
git fetch origin
git reset --hard origin/main
npm install
pm2 start app.js --name milktea-api
pm2 save
pm2 status
echo ''
echo '部署完成！'
echo '服务地址: http://$ServerIP:3003'
echo '健康检查: http://$ServerIP:3003/api/health'
"@

ssh "${ServerUser}@${ServerIP}" $deployCommands

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "服务地址: http://$ServerIP:3003" -ForegroundColor White
Write-Host "健康检查: http://$ServerIP:3003/api/health" -ForegroundColor White
