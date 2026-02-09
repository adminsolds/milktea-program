# 奶茶店小程序后端部署脚本 (阿里云服务器)
# 服务器地址: 39.102.214.230
# 登录名: root
# 密码: Sage5568

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "奶茶店小程序后端部署脚本 (阿里云)" -ForegroundColor Cyan
Write-Host "目标服务器: 39.102.214.230" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 配置
$SERVER_IP = "39.102.214.230"
$SERVER_USER = "root"
$SERVER_PASSWORD = "Sage5568"
$DEPLOY_DIR = "/opt/milktea-backend"
$BACKUP_DIR = "/opt/backups/milktea-backend"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# 安装 posh-ssh 模块（如果没有）
if (!(Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "正在安装 Posh-SSH 模块..." -ForegroundColor Yellow
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser
}
Import-Module Posh-SSH

Write-Host ""
Write-Host "步骤 1: 检查服务器连接..." -ForegroundColor Yellow
$pingResult