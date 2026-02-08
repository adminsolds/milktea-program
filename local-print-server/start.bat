@echo off
chcp 65001 >nul
echo =================================
echo  本地打印服务启动工具
echo =================================
echo.

:: 检查是否安装了 Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] 检测到 Node.js 版本:
node -v
echo.

:: 检查是否需要安装依赖
if not exist "node_modules" (
    echo [2/3] 正在安装依赖...
    npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [2/3] 依赖已安装，跳过安装步骤
)
echo.

echo [3/3] 正在启动本地打印服务...
echo =================================
echo 服务启动后，请保持此窗口运行
echo 访问地址: http://localhost:3001
echo =================================
echo.

npm start

pause
