# ESC-POS 打印功能说明

## 概述

本系统支持 ESC-POS 指令标准打印，适用于美团智能商用终端等内置热敏打印机的设备。

## 功能特点

1. **自动检测**：优先尝试 ESC-POS 打印，失败时自动回退到浏览器打印
2. **双模式支持**：
   - USB 打印机（默认，适用于美团智能商用终端）
   - 网络打印机（通过 IP 地址连接）
3. **打印内容**：
   - 58mm 小票打印
   - 40x30mm / 50x30mm 标签打印

## 打印机配置

### USB 打印机配置

默认配置：
- VID: 0x0483
- PID: 0x5743

如需修改，请更新 `services/escposPrintService.js` 中的 `PRINTER_CONFIG.usb`。

### 网络打印机配置

默认配置：
- Host: 192.168.1.100
- Port: 9100

如需修改，请更新 `services/escposPrintService.js` 中的 `PRINTER_CONFIG.network`。

## API 接口

### 1. 测试打印机连接

```http
POST /api/print/test
Content-Type: application/json
Authorization: Bearer {token}

{
  "printerType": "usb"  // 或 "network"
}
```

### 2. 打印订单（小票+标签）

```http
POST /api/print/order/{orderId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "printerType": "usb"  // 或 "network"
}
```

### 3. 单独打印小票

```http
POST /api/print/receipt/{orderId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "printerType": "usb"
}
```

### 4. 单独打印标签

```http
POST /api/print/label/{orderId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "itemIndex": 0,       // 商品索引
  "printerType": "usb"
}
```

### 5. 获取打印机配置

```http
GET /api/print/config
Authorization: Bearer {token}
```

### 6. 更新打印机配置

```http
PUT /api/print/config
Content-Type: application/json
Authorization: Bearer {token}

{
  "usb": {
    "vid": 0x0483,
    "pid": 0x5743
  },
  "network": {
    "host": "192.168.1.100",
    "port": 9100
  }
}
```

## 使用说明

### 现场点单页面

1. 点击页面顶部的"测试打印机"按钮，测试打印机连接
2. 下单成功后，系统会自动打印小票和标签
3. 如果 ESC-POS 打印失败，会自动回退到浏览器打印

### 故障排查

1. **打印机无响应**
   - 检查打印机电源是否开启
   - 检查 USB 连接线是否松动
   - 运行"测试打印机"查看具体错误信息

2. **打印内容错位**
   - 调整 `services/escposPrintService.js` 中的打印参数
   - 检查打印机纸张宽度设置（58mm 小票 / 40mm 标签）

3. **回退到浏览器打印**
   - 这是正常行为，确保打印功能可用
   - 如需使用 ESC-POS，请检查打印机连接和配置

## 技术实现

### 依赖库

- `escpos`: ESC-POS 指令库
- `escpos-usb`: USB 打印机支持
- `escpos-network`: 网络打印机支持

### 打印流程

1. 前端调用 `/api/print/order/{orderId}` 接口
2. 后端获取订单数据
3. 使用 `escpos` 库生成打印指令
4. 通过 USB/网络发送到打印机
5. 返回打印结果给前端

### 打印内容格式

**小票内容：**
- 店铺名称（居中，加粗，放大）
- 订单信息（订单号、时间、支付方式、电话）
- 商品列表（名称、数量、价格）
- 金额明细（商品金额、配送费、折扣、合计）
- 取餐信息
- 备注
- 页脚（感谢语）

**标签内容：**
- 商品名称（居中，放大）
- 规格信息（糖度、冰度、加料）
- 序号（[当前/总数]）
- 数量
- 条形码（订单号后6位）

## 注意事项

1. 美团智能商用终端通常使用 USB 连接打印机
2. 打印前请确保打印机有足够的纸张
3. 首次使用建议先运行"测试打印机"确认连接正常
4. 如需修改打印格式，请编辑 `services/escposPrintService.js`

## 更新日志

### 2026-02-07
- 初始版本发布
- 支持 ESC-POS 指令打印
- 支持 USB 和网络打印机
- 自动回退到浏览器打印
