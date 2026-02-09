Import-Module Posh-SSH

# 切换到当前目录
Set-Location "f:\奶茶店小程序\后台\backend"

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
        # 读取本地文件内容
        Write-Host "正在读取本地文件..."
        $content = Get-Content -Path $localFile -Raw
        
        # 检查文件是否存在
        if (-not $content) {
            Write-Host "本地文件不存在或为空！" -ForegroundColor Red
            return
        }
        
        # 清空远程文件
        Write-Host "正在清空远程文件..."
        Invoke-SSHCommand -SessionId $session.SessionId -Command "> $remoteFile"
        
        # 上传文件 - 使用更简单的方法
        Write-Host "正在上传文件到服务器..."
        
        # 将内容分成多行，每行单独上传
        $lines = $content -split "\n"
        
        foreach ($line in $lines) {
            # 转义特殊字符
            $escapedLine = $line -replace '\\', '\\\\' -replace "'", "''"
            # 追加到远程文件
            Invoke-SSHCommand -SessionId $session.SessionId -Command "echo '$escapedLine' >> $remoteFile"
        }
        
        # 重启服务
        Write-Host "正在重启服务..."
        $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 restart milktea-backend"
        Write-Host "服务重启结果:"
        Write-Host $result.Output
        
        Write-Host "文件上传成功！" -ForegroundColor Green
        Write-Host "登录页面已更新。" -ForegroundColor Green
        
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
