@echo off
chcp 65001
cls
echo ==========================================
echo    设置 ADB 端口转发
echo ==========================================
echo.

:: 尝试找到 adb.exe
set "ADB_PATH="

:: 常见路径检查
if exist "C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\adb.exe" (
    set "ADB_PATH=C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\adb.exe"
)

if exist "D:\Android\Sdk\platform-tools\adb.exe" (
    set "ADB_PATH=D:\Android\Sdk\platform-tools\adb.exe"
)

if exist "C:\Program Files\Android\Android Studio\sdk\platform-tools\adb.exe" (
    set "ADB_PATH=C:\Program Files\Android\Android Studio\sdk\platform-tools\adb.exe"
)

if defined ADB_PATH (
    echo 找到 ADB: %ADB_PATH%
    echo.
    echo 正在设置端口转发...
    "%ADB_PATH%" reverse tcp:8080 tcp:8080
    echo.
    echo 正在检查设备...
    "%ADB_PATH%" devices
    echo.
    echo ==========================================
    echo    端口转发设置完成！
    echo    模拟器现在可以通过 localhost:8080 访问服务器
echo ==========================================
) else (
    echo 错误：找不到 adb.exe
echo.
    echo 请手动找到 adb.exe 的路径，然后执行：
    echo   adb reverse tcp:8080 tcp:8080
    echo.
    echo 常见位置：
    echo   - C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\
    echo   - D:\Android\Sdk\platform-tools\
    echo   - Android Studio 安装目录下的 sdk\platform-tools\
)

pause
