# WebUSB 打印功能部署脚本
# 服务器地址: 39.102.214.230

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "WebUSB 打印功能部署脚本" -ForegroundColor Cyan
Write-Host "目标服务器: 39.102.214.230" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 配置
$SERVER_IP = "39.102.214.230"
$SERVER_USER = "root"
$SERVER_PASSWORD = "Sage5568"
$DEPLOY_DIR = "/opt/milktea-backend"

# 安装 posh-ssh 模块（如果没有）
if (!(Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "正在安装 Posh-SSH 模块..." -ForegroundColor Yellow
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser
}
Import-Module Posh-SSH

# 创建 SSH 会话
Write-Host ""
Write-Host "步骤 1: 连接到服务器..." -ForegroundColor Yellow
$SecurePassword = ConvertTo-SecureString $SERVER_PASSWORD -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($SERVER_USER, $SecurePassword)

$Session = $null
try {
    $Session = New-SSHSession -ComputerName $SERVER_IP -Credential $Credential -AcceptKey
    Write-Host "✓ 服务器连接成功" -ForegroundColor Green
} catch {
    Write-Host "✗ 连接服务器失败: $_" -ForegroundColor Red
    exit 1
}

# 创建必要的目录
Write-Host ""
Write-Host "步骤 2: 创建目录..." -ForegroundColor Yellow
try {
    Invoke-SSHCommand -SSHSession $Session -Command "mkdir -p $DEPLOY_DIR/public/js" | Out-Null
    Invoke-SSHCommand -SSHSession $Session -Command "mkdir -p $DEPLOY_DIR/local-print-server" | Out-Null
    Invoke-SSHCommand -SSHSession $Session -Command "mkdir -p $DEPLOY_DIR/docs" | Out-Null
    Write-Host "✓ 目录创建成功" -ForegroundColor Green
} catch {
    Write-Host "✗ 目录创建失败: $_" -ForegroundColor Red
}

# 上传文件
Write-Host ""
Write-Host "步骤 3: 上传 WebUSB 打印机库..." -ForegroundColor Yellow
try {
    Set-SCPFile -ComputerName $SERVER_IP -Credential $Credential `
        -LocalFile "public/js/webusb-printer.js" `
        -RemotePath "$DEPLOY_DIR/public/js/"
    Write-Host "✓ webusb-printer.js 上传成功" -ForegroundColor Green
} catch {
    Write-Host "✗ webusb-printer.js 上传失败: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "步骤 4: 上传本地打印服务..." -ForegroundColor Yellow
$localPrintFiles = @(
    "local-print-server/package.json",
    "local-print-server/server.js",
    "local-print-server/start.bat",
    "local-print-server/README.md"
)

foreach ($file in $localPrintFiles) {
    if (Test-Path $file) {
        try {
            Set-SCPFile -ComputerName $SERVER_IP -Credential $Credential `
                -LocalFile $file `
                -RemotePath "$DEPLOY_DIR/local-print-server/"
            Write-Host "✓ $file 上传成功" -ForegroundColor Green
        } catch {
            Write-Host "✗ $file 上传失败: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠ $file 不存在，跳过" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "步骤 5: 上传使用文档..." -ForegroundColor Yellow
try {
    Set-SCPFile -ComputerName $SERVER_IP -Credential $Credential `
        -LocalFile "docs/webusb-print-guide.md" `
        -RemotePath "$DEPLOY_DIR/docs/"
    Write-Host "✓ webusb-print-guide.md 上传成功" -ForegroundColor Green
} catch {
    Write-Host "✗ webusb-print-guide.md 上传失败: $_" -ForegroundColor Red
}

# 更新 pos.ejs 文件
Write-Host ""
Write-Host "步骤 6: 更新 pos.ejs..." -ForegroundColor Yellow
try {
    Set-SCPFile -ComputerName $SERVER_IP -Credential $Credential `
        -LocalFile "views/pos.ejs" `
        -RemotePath "$DEPLOY_DIR/views/"
    Write-Host "✓ pos.ejs 更新成功" -ForegroundColor Green
} catch {
    Write-Host "✗ pos.ejs 更新失败: $_" -ForegroundColor Red
}

# 重启服务
Write-Host ""
Write-Host "步骤 7: 重启服务..." -ForegroundColor Yellow
try {
    Invoke-SSHCommand -SSHSession $Session -Command "cd $DEPLOY_DIR ; pm2 restart milktea-backend" | Out-Null
    Write-Host "✓ 服务重启成功" -ForegroundColor Green
} catch {
    Write-Host "⚠ 服务重启可能失败，请手动检查" -ForegroundColor Yellow
}

# 关闭 SSH 会话
if ($Session) {
    Remove-SSHSession -SSHSession $Session | Out-Null
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "部署完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "部署内容：" -ForegroundColor Yellow
Write-Host "  - WebUSB 打印机库 (public/js/webusb-printer.js)" -ForegroundColor White
Write-Host "  - 本地打印服务 (local-print-server/)" -ForegroundColor White
Write-Host "  - 使用文档 (docs/webusb-print-guide.md)" -ForegroundColor White
Write-Host "  - 更新现场点单页面 (views/pos.ejs)" -ForegroundColor White
Write-Host ""
Write-Host "访问地址: http://39.102.214.230:3000/admin/pos" -ForegroundColor Cyan
Write-Host ""
