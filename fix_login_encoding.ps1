Import-Module Posh-SSH

# 服务器连接信息
$server = "39.102.214.230"
$username = "root"
$password = "Sage5568"

# 本地和远程文件路径
$localFile = ".\views\login.ejs"
$remoteFile = "/opt/milktea-backend/views/login.ejs"

# 连接服务器
Write-Host "正在连接服务器..."
$securePassword = ConvertTo-SecureString $password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($username, $securePassword)
$session = New-SSHSession -ComputerName $server -Credential $credential -AcceptKey

if ($session) {
    Write-Host "服务器连接成功！"
    
    try {
        # 读取本地文件内容（使用UTF-8编码）
        Write-Host "正在读取本地文件..."
        $content = Get-Content -Path $localFile -Encoding UTF8 -Raw
        
        # 检查文件是否存在
        if (-not $content) {
            Write-Host "本地文件不存在或为空！" -ForegroundColor Red
            return
        }
        
        # 清空远程文件
        Write-Host "正在清空远程文件..."
        Invoke-SSHCommand -SessionId $session.SessionId -Command "> $remoteFile"
        
        # 使用更可靠的方法上传文件：通过创建临时文件然后移动
        Write-Host "正在上传文件到服务器..."
        
        # 创建临时脚本文件
        $tempScript = @'
#!/bin/bash

# 写入文件内容
cat > /tmp/login.ejs << 'EOF'
CONTENT_PLACEHOLDER
EOF

# 移动到目标位置
mv /tmp/login.ejs /opt/milktea-backend/views/login.ejs

# 重启服务
pm2 restart milktea-backend
'@
        
        # 替换内容占位符
        $tempScript = $tempScript -replace 'CONTENT_PLACEHOLDER', $content
        
        # 上传临时脚本
        $tempScriptPath = "/tmp/upload_login.sh"
        Invoke-SSHCommand -SessionId $session.SessionId -Command "echo '$tempScript' > $tempScriptPath"
        Invoke-SSHCommand -SessionId $session.SessionId -Command "chmod +x $tempScriptPath"
        
        # 执行临时脚本
        Write-Host "正在执行上传脚本..."
        $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "$tempScriptPath"
        Write-Host "上传结果:"
        Write-Host $result.Output
        
        # 清理临时文件
        Invoke-SSHCommand -SessionId $session.SessionId -Command "rm $tempScriptPath"
        
        Write-Host "文件上传成功！" -ForegroundColor Green
        Write-Host "登录页面已修复。" -ForegroundColor Green
        
    } catch {
        Write-Host "上传失败: $($_.Exception.Message)" -ForegroundColor Red
    } finally {
        # 关闭会话
        Remove-SSHSession -SessionId $session.SessionId
        Write-Host "服务器连接已关闭。"
    }
} else {
    Write-Host "服务器连接失败！" -ForegroundColor Red
}
