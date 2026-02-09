# Deploy WebUSB print function to server
$SERVER_IP = "39.102.214.230"
$SERVER_USER = "root"
$SERVER_PASSWORD = "Sage5568"
$DEPLOY_DIR = "/opt/milktea-backend"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deploy WebUSB Print Function" -ForegroundColor Cyan
Write-Host "Server: $SERVER_IP" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Import Posh-SSH
Import-Module Posh-SSH

# Create credential
$SecurePassword = ConvertTo-SecureString $SERVER_PASSWORD -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($SERVER_USER, $SecurePassword)

# Create SSH session
Write-Host ""
Write-Host "Connecting to server..." -ForegroundColor Yellow
$Session = New-SSHSession -ComputerName $SERVER_IP -Credential $Credential -AcceptKey
Write-Host "Connected!" -ForegroundColor Green

# Create directories
Write-Host ""
Write-Host "Creating directories..." -ForegroundColor Yellow
Invoke-SSHCommand -SSHSession $Session -Command "mkdir -p $DEPLOY_DIR/public/js" | Out-Null
Invoke-SSHCommand -SSHSession $Session -Command "mkdir -p $DEPLOY_DIR/docs" | Out-Null
Invoke-SSHCommand -SSHSession $Session -Command "mkdir -p $DEPLOY_DIR/local-print-server" | Out-Null
Write-Host "Directories created" -ForegroundColor Green

# Upload files using SCP
Write-Host ""
Write-Host "Uploading files..." -ForegroundColor Yellow

Write-Host "  webusb-printer.js..." -NoNewline
try {
    Set-SCPItem -ComputerName $SERVER_IP -Credential $Credential -Path "public/js/webusb-printer.js" -Destination "$DEPLOY_DIR/public/js/" -AcceptKey
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " Failed" -ForegroundColor Red
}

Write-Host "  pos.ejs..." -NoNewline
try {
    Set-SCPItem -ComputerName $SERVER_IP -Credential $Credential -Path "views/pos.ejs" -Destination "$DEPLOY_DIR/views/" -AcceptKey
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " Failed" -ForegroundColor Red
}

Write-Host "  webusb-print-guide.md..." -NoNewline
try {
    Set-SCPItem -ComputerName $SERVER_IP -Credential $Credential -Path "docs/webusb-print-guide.md" -Destination "$DEPLOY_DIR/docs/" -AcceptKey
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " Failed" -ForegroundColor Red
}

Write-Host "  Local print server files..." -ForegroundColor Yellow
$localFiles = @("package.json", "server.js", "start.bat", "README.md")
foreach ($file in $localFiles) {
    $localPath = "local-print-server/$file"
    if (Test-Path $localPath) {
        Write-Host "    $file..." -NoNewline
        try {
            Set-SCPItem -ComputerName $SERVER_IP -Credential $Credential -Path $localPath -Destination "$DEPLOY_DIR/local-print-server/" -AcceptKey
            Write-Host " OK" -ForegroundColor Green
        } catch {
            Write-Host " Failed" -ForegroundColor Red
        }
    }
}

# Restart service
Write-Host ""
Write-Host "Restarting service..." -ForegroundColor Yellow
Invoke-SSHCommand -SSHSession $Session -Command "cd $DEPLOY_DIR ; pm2 restart milktea-backend" | Out-Null
Write-Host "Service restarted" -ForegroundColor Green

# Close SSH session
Remove-SSHSession -SSHSession $Session | Out-Null

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deploy Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access: http://$SERVER_IP`:3000/admin/pos" -ForegroundColor Cyan
Write-Host ""
