Import-Module Posh-SSH

# 服务器连接信息
$server = "39.102.214.230"
$username = "root"
$password = "Sage5568"

# 本地和远程文件路径
$localFile = "f:\奶茶店小程序\后台\backend\views\login.ejs"
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
        
        # 分块上传文件
        Write-Host "正在上传文件到服务器..."
        
        # 清空远程文件
        Invoke-SSHCommand -SessionId $session.SessionId -Command "> $remoteFile"
        
        # 计算文件大小和分块数量
        $chunkSize = 8000
        $totalChunks = [math]::Ceiling($content.Length / $chunkSize)
        
        Write-Host "文件大小: $($content.Length) 字节"
        Write-Host "分块数量: $totalChunks"
        
        # 分块写入文件
        for ($i = 0; $i -lt $totalChunks; $i++) {
            $start = $i * $chunkSize
            $end = [math]::Min(($i + 1) * $chunkSize, $content.Length)
            $chunk = $content.Substring($start, $end - $start)
            
            # 转义特殊字符
            $chunk = $chunk -replace '\\', '\\\\' -replace '"', '\"' -replace '`', '\\`' -replace '\$', '\\$'
            
            # 写入分块
            $command = "echo \"$chunk\" >> $remoteFile"
            Invoke-SSHCommand -SessionId $session.SessionId -Command $command
            
            # 显示进度
            $progress = [math]::Round(($i + 1) / $totalChunks * 100, 2)
            Write-Host "上传进度: $progress% ($($i + 1)/$totalChunks)"
        }
        
        # 重启服务
        Write-Host "正在重启服务..."
        $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 restart milktea-backend"
        Write-Host "服务重启结果:"
        Write-Host $result.Output
        
        Write-Host "文件上传成功！"
        Write-Host "登录页面已更新。"
        
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
