@echo off
chcp 65001
cls
echo ==========================================
echo    开放防火墙端口 8080
echo ==========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误：请以管理员身份运行此脚本！
    echo 右键点击脚本，选择"以管理员身份运行"
    pause
    exit /b 1
)

echo [1/2] 正在添加防火墙规则...
netsh advfirewall firewall add rule name="Node.js Server 8080" dir=in action=allow protocol=TCP localport=8080
echo      入站规则已添加
echo.

echo [2/2] 正在添加出站规则...
netsh advfirewall firewall add rule name="Node.js Server 8080 Out" dir=out action=allow protocol=TCP localport=8080
echo      出站规则已添加
echo.

echo ==========================================
echo    防火墙端口已开放！
echo    端口: 8080
echo ==========================================
pause
