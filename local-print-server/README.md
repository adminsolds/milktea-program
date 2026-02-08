# 本地打印服务

用于美团点餐机 MT-3Sp 浏览器调用本地打印机的解决方案。

## 问题背景

美团点餐机 MT-3Sp 的打印机是通过美团系统 APP 管理的，浏览器（谷歌浏览器）无法直接访问打印机。此本地打印服务作为中间层，让浏览器可以通过 HTTP 请求调用本地打印机。

## 工作原理

```
浏览器(现场点单页面) 
    ↓ HTTP 请求
本地打印服务 (localhost:3001)
    ↓ ESC-POS 指令
USB/网络打印机
```

## 安装步骤

### 1. 安装 Node.js

在美团点餐机上安装 Node.js：
- 访问 https://nodejs.org/
- 下载 LTS 版本（推荐 18.x 或更高）
- 运行安装程序，按默认设置安装

### 2. 复制打印服务文件

将 `local-print-server` 文件夹复制到美团点餐机的任意位置，例如：
```
C:\milktea-print-server\
```

### 3. 安装依赖并启动

**方法一：使用启动脚本（推荐）**

双击运行 `start.bat`，脚本会自动：
1. 检查 Node.js 是否安装
2. 安装依赖（首次运行）
3. 启动打印服务

**方法二：手动启动**

打开命令提示符，进入打印服务目录：
```bash
cd C:\milktea-print-server
npm install
npm start
```

### 4. 验证服务是否启动

打开浏览器，访问：
```
http://localhost:3001/health
```

如果看到以下响应，说明服务启动成功：
```json
{
  "success": true,
  "message": "本地打印服务运行正常",
  "timestamp": "2026-02-08T10:30:00.000Z"
}
```

## 配置打印机

### USB 打印机

系统会自动检测 USB 打印机。如果检测不到，可能需要修改 `server.js` 中的 VID 和 PID：

```javascript
const PRINTER_CONFIG = {
  usb: {
    vid: 0x0483,  // 修改为您的打印机 VID
    pid: 0x5743,  // 修改为您的打印机 PID
  }
};
```

查找 VID 和 PID 的方法：
1. 连接打印机
2. 打开设备管理器
3. 找到打印机设备
4. 查看属性 -> 详细信息 -> 硬件 ID

### 网络打印机

修改 `server.js` 中的网络打印机配置：

```javascript
const PRINTER_CONFIG = {
  network: {
    host: '192.168.1.100',  // 打印机 IP 地址
    port: 9100,             // 打印机端口
  }
};
```

## 使用方法

1. 确保本地打印服务已启动（保持命令窗口运行）
2. 在美团点餐机的谷歌浏览器中打开后台现场点单页面
3. 正常下单，打印功能会自动调用本地打印服务

## API 接口

### 健康检查
```
GET http://localhost:3001/health
```

### 获取打印机列表
```
GET http://localhost:3001/printers
```

### 打印小票
```
POST http://localhost:3001/print/receipt
Content-Type: application/json

{
  "order": { ...订单数据... },
  "printerType": "usb"
}
```

### 打印标签
```
POST http://localhost:3001/print/labels
Content-Type: application/json

{
  "order": { ...订单数据... },
  "items": [ ...商品列表... ],
  "printerType": "usb"
}
```

### 打印订单（小票+标签）
```
POST http://localhost:3001/print/order
Content-Type: application/json

{
  "order": { ...订单数据... },
  "printerType": "usb"
}
```

## 故障排除

### 问题1：无法启动服务

**症状**：运行 `start.bat` 后窗口闪退

**解决方案**：
1. 检查 Node.js 是否安装：`node -v`
2. 手动打开命令提示符，进入目录运行 `npm install`
3. 查看错误信息

### 问题2：浏览器无法连接到本地服务

**症状**：下单后提示打印失败

**解决方案**：
1. 检查服务是否运行：访问 http://localhost:3001/health
2. 检查防火墙设置，确保端口 3001 未被阻止
3. 检查浏览器控制台是否有 CORS 错误

### 问题3：找不到打印机

**症状**：提示"获取USB打印机失败"

**解决方案**：
1. 检查打印机是否已连接并开机
2. 检查 USB 线是否连接正常
3. 更新打印机驱动程序
4. 修改 `server.js` 中的 VID 和 PID

### 问题4：打印内容乱码

**症状**：打印出来的内容显示乱码

**解决方案**：
1. 检查打印机是否支持 ESC-POS 指令
2. 尝试更换打印机驱动
3. 调整打印机编码设置

## 开机自动启动

### 方法一：创建快捷方式

1. 右键 `start.bat` -> 创建快捷方式
2. 按 `Win + R`，输入 `shell:startup`
3. 将快捷方式复制到启动文件夹

### 方法二：使用 nssm 创建 Windows 服务（推荐）

1. 下载 nssm：https://nssm.cc/download
2. 解压 nssm.exe 到任意目录
3. 以管理员身份运行命令提示符：
```bash
nssm install MilkTeaPrintServer
cd C:\milktea-print-server
npm start
```
4. 设置服务自动启动

## 注意事项

1. **保持服务运行**：打印服务需要保持运行状态，不要关闭命令窗口
2. **防火墙设置**：确保 Windows 防火墙允许 Node.js 访问网络
3. **打印机驱动**：确保打印机驱动已正确安装
4. **USB 权限**：某些系统可能需要管理员权限才能访问 USB 设备

## 技术支持

如有问题，请检查：
1. 浏览器控制台日志（F12 -> Console）
2. 打印服务命令窗口的输出日志
3. 打印机连接状态和驱动程序
