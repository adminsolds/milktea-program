# 测试图片上传API
$filePath = "f:\奶茶店小程序\backend\views\favicon.ico"
$apiUrl = "http://localhost:3000/api/upload/image"

# 检查文件是否存在
if (-not (Test-Path $filePath)) {
    Write-Host "文件不存在: $filePath"
    exit 1
}

# 创建FormData
$form = @{image = Get-Item $filePath}

# 发送请求
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Form $form
    Write-Host "请求成功!"
    Write-Host "返回结果:"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "请求失败:"
    Write-Host $_.Exception.Message
    Write-Host $_.ScriptStackTrace
}