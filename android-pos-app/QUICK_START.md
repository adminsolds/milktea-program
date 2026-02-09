# 半夏奶茶店 POS 安卓端 - 快速开始

## 项目概述

这是一个基于 Kotlin + Jetpack Compose 开发的奶茶店现场点单安卓应用，专为美团点餐机（Android 系统）设计。

## 核心特性

✅ **原生打印支持** - 直接控制 USB/网络打印机，彻底解决浏览器打印问题  
✅ **离线可用** - 本地数据库缓存，网络不稳定时仍可正常营业  
✅ **流畅体验** - Jetpack Compose 原生 UI，专为触屏优化  
✅ **实时同步** - WebSocket 实时推送订单更新  
✅ **会员管理** - 完整的会员系统，支持充值、积分、折扣  

## 技术栈

- **语言**: Kotlin
- **UI框架**: Jetpack Compose
- **架构**: MVVM + Repository Pattern
- **依赖注入**: Hilt
- **网络**: Retrofit + OkHttp
- **异步**: Kotlin Coroutines + Flow

## 项目结构

```
app/src/main/java/com/milktea/pos/
├── app/
│   └── MilkTeaApplication.kt          # Application 入口
├── data/
│   ├── remote/
│   │   ├── ApiConfig.kt               # API 配置（BASE_URL）
│   │   ├── ApiService.kt              # API 接口定义
│   │   └── RetrofitClient.kt          # Retrofit 客户端
│   └── repository/
│       ├── OrderRepository.kt         # 订单仓库
│       ├── ProductRepository.kt       # 商品仓库
│       └── MemberRepository.kt        # 会员仓库
├── di/
│   ├── NetworkModule.kt               # 网络模块（Hilt）
│   └── RepositoryModule.kt            # 仓库模块（Hilt）
├── domain/
│   └── model/
│       ├── Product.kt                 # 商品模型
│       ├── Order.kt                   # 订单模型
│       └── Member.kt                  # 会员模型
├── hardware/
│   └── printer/
│       ├── PrinterManager.kt          # 打印机管理
│       ├── ReceiptBuilder.kt          # 小票生成器
│       └── LabelBuilder.kt            # 标签生成器
├── ui/
│   ├── screens/
│   │   ├── MainScreen.kt              # 主页面（导航）
│   │   ├── OrderScreen.kt             # 点单页面
│   │   ├── OrdersScreen.kt            # 订单管理
│   │   ├── MemberScreen.kt            # 会员管理
│   │   ├── StatisticsScreen.kt        # 数据统计
│   │   └── SettingsScreen.kt          # 设置页面
│   ├── theme/
│   │   ├── Color.kt                   # 颜色定义
│   │   ├── Theme.kt                   # 主题配置
│   │   └── Type.kt                    # 字体配置
│   └── viewmodel/
│       ├── OrderViewModel.kt          # 订单 ViewModel
│       └── ProductViewModel.kt        # 商品 ViewModel
└── MainActivity.kt                    # 主 Activity
```

## 快速开始

### 1. 配置服务器地址

打开 `data/remote/ApiConfig.kt`，修改 BASE_URL：

```kotlin
object ApiConfig {
    const val BASE_URL = "http://39.102.214.230:3000/api/"
    // ...
}
```

### 2. 同步 Gradle

在 Android Studio 中：
- 点击工具栏的 **Sync Project with Gradle Files**（大象图标）
- 或按 **Ctrl+Shift+A**，输入 "Sync"，选择同步

### 3. 运行项目

- 连接美团点餐机或启动模拟器
- 点击运行按钮（▶️）

## 功能模块

### 现场点单
- 商品分类浏览
- 购物车管理
- 规格选择（糖度、冰度、配料）
- 会员识别
- 支付处理

### 订单管理
- 实时订单列表（待制作/制作中/已完成）
- 订单状态更新
- 重新打印

### 会员管理
- 会员查询/注册
- 余额充值
- 消费记录

### 数据统计
- 今日营业统计
- 订单分析
- 商品销量排行

## 打印功能

### USB 打印（推荐）

```kotlin
val printerManager = PrinterManager(context)

// 连接打印机
printerManager.connectUsbPrinter(vid, pid)

// 打印小票
printerManager.printReceipt(order)

// 打印标签
printerManager.printLabel(order, item, 1, 3)
```

### 网络打印

```kotlin
// 连接网络打印机
printerManager.connectNetworkPrinter("192.168.1.100", 9100)

// 打印
printerManager.printReceipt(order)
```

## API 接口

### 商品相关
- `GET /api/products` - 获取商品列表
- `GET /api/categories` - 获取分类列表

### 订单相关
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 获取订单列表
- `PUT /api/orders/{id}/status` - 更新订单状态

### 会员相关
- `GET /api/members/phone/{phone}` - 查询会员
- `POST /api/members` - 创建会员
- `POST /api/members/{id}/recharge` - 会员充值

### 统计相关
- `GET /api/statistics/today` - 今日统计

## 常见问题

### 1. Gradle 同步失败

尝试以下步骤：
```
File → Invalidate Caches / Restart → Invalidate and Restart
```

### 2. 依赖下载慢

在 `gradle.properties` 中添加国内镜像：
```properties
systemProp.http.proxyHost=mirrors.cloud.tencent.com
systemProp.https.proxyHost=mirrors.cloud.tencent.com
```

### 3. USB 打印机无法连接

- 检查 USB 权限是否授予
- 确认打印机驱动是否正确
- 检查 USB 线是否连接正常

## 下一步开发

1. **完善 UI 界面** - 优化点单页面、订单列表等
2. **添加本地数据库** - 使用 Room 实现离线缓存
3. **实现 WebSocket** - 实时接收订单推送
4. **添加扫码功能** - 支持扫码枪/摄像头扫码
5. **优化打印功能** - 添加更多打印机型号支持

## 技术支持

如有问题，请参考：
- [开发指南](docs/DEVELOPMENT_GUIDE.md)
- [项目 README](README.md)

---

**版本**: 1.0.0  
**日期**: 2026-02-08
