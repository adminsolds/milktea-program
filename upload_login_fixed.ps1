Import-Module Posh-SSH

# Server connection info
$server = "39.102.214.230"
$username = "root"
$password = "Sage5568"

# File paths
$localFile = "f:\奶茶店小程序\后台\backend\views\login.ejs"
$remoteFile = "/opt/milktea-backend/views/login.ejs"

# Connect to server
Write-Host "Connecting to server..."
$securePassword = ConvertTo-SecureString $password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($username, $securePassword)
$session = New-SSHSession -ComputerName $server -Credential $credential -AcceptKey

if ($session) {
    Write-Host "Server connected successfully!"
    
    try {
        # Read local file content
        Write-Host "Reading local file..."
        $content = Get-Content -Path $localFile -Raw
        
        # Clear remote file
        Write-Host "Clearing remote file..."
        Invoke-SSHCommand -SessionId $session.SessionId -Command "> $remoteFile"
        
        # Upload file in chunks
        Write-Host "Uploading file to server..."
        
        # Split content into smaller chunks
        $lines = $content -split "\r\n"
        $batchSize = 50
        $totalBatches = [math]::Ceiling($lines.Length / $batchSize)
        
        for ($i = 0; $i -lt $totalBatches; $i++) {
            $startIndex = $i * $batchSize
            $endIndex = [math]::Min(($i + 1) * $batchSize - 1, $lines.Length - 1)
            $batchLines = $lines[$startIndex..$endIndex]
            $batchContent = $batchLines -join "\n"
            
            # Escape special characters
            $batchContent = $batchContent -replace '\\', '\\\\' -replace '"', '\"'
            
            # Append batch to remote file
            $command = "echo '$batchContent' >> $remoteFile"
            Invoke-SSHCommand -SessionId $session.SessionId -Command $command
            
            # Show progress
            $progress = [math]::Round(($i + 1) / $totalBatches * 100, 2)
            Write-Host "Upload progress: $progress% ($($i + 1)/$totalBatches)"
        }
        
        # Restart service
        Write-Host "Restarting service..."
        $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "pm2 restart milktea-backend"
        Write-Host "Service restart result:"
        Write-Host $result.Output
        
        Write-Host "File uploaded successfully!"
        Write-Host "Login page has been updated."
        
    } catch {
        Write-Host "Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    } finally {
        # Close session
        Remove-SSHSession -SessionId $session.SessionId
        Write-Host "Server connection closed."
    }
} else {
    Write-Host "Server connection failed!" -ForegroundColor Red
}
