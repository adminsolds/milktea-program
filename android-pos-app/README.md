# 半夏奶茶店 POS 安卓端

> 专为美团点餐机（Android 系统）设计的现场点单应用

## 项目简介

这是一个基于 Kotlin + Jetpack Compose 开发的奶茶店现场点单安卓应用，旨在解决美团点餐机上浏览器无法调用打印机的问题。

## 核心特性

✅ **原生打印支持** - 直接控制 USB/网络打印机，彻底解决浏览器打印问题  
✅ **离线可用** - Room 本地数据库，网络不稳定时仍可正常营业  
✅ **实时同步** - WebSocket 实时接收小程序订单推送  
✅ **流畅体验** - Jetpack Compose 原生 UI，专为触屏优化  
✅ **会员系统** - 完整的会员管理，支持充值、积分、折扣  
✅ **数据统计** - 实时营业数据统计分析  

## 技术架构

```
┌─────────────────────────────────────────┐
│              UI 层 (Compose)             │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │ 点单页  │ │ 订单页  │ │ 会员页    │ │
│  └─────────┘ └─────────┘ └───────────┘ │
└─────────────────────────────────────────┘
│           ViewModel 层 (MVVM)            │
└─────────────────────────────────────────┘
│           Repository 层                  │
│  ┌──────────────┐  ┌──────────────┐     │
│  │ 网络数据 (API)│  │ 本地数据 (DB)│     │
│  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
│           硬件层                         │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ USB打印  │ │ 网络打印 │ │ 扫码枪  │ │
│  └──────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────┘
```

## 技术栈

- **语言**: Kotlin 1.9.20
- **UI框架**: Jetpack Compose 2023.10.01
- **架构**: MVVM + Repository Pattern
- **依赖注入**: Hilt 2.48
- **网络**: Retrofit 2.9.0 + OkHttp 4.12.0
- **数据库**: Room 2.6.1
- **异步**: Kotlin Coroutines + Flow
- **图片加载**: Coil 2.5.0
- **扫码**: ZXing Android Embedded 4.3.0

## 项目结构

```
app/src/main/java/com/milktea/pos/
├── app/
│   └── MilkTeaApplication.kt              # Application 入口
├── data/
│   ├── local/                             # Room 本地数据库
│   │   ├── AppDatabase.kt
│   │   ├── dao/                          # 数据访问对象
│   │   │   ├── ProductDao.kt
│   │   │   ├── CategoryDao.kt
│   │   │   └── OrderDao.kt
│   │   └── entity/                       # 数据库实体
│   │       ├── ProductEntity.kt
│   │       ├── CategoryEntity.kt
│   │       └── OrderEntity.kt
│   ├── remote/                            # 网络层
│   │   ├── ApiConfig.kt                   # API 配置
│   │   ├── ApiService.kt                  # API 接口
│   │   ├── RetrofitClient.kt              # Retrofit 客户端
│   │   └── websocket/                     # WebSocket
│   │       └── WebSocketManager.kt
│   └── repository/                        # 数据仓库
│       ├── OrderRepository.kt
│       ├── ProductRepository.kt
│       └── MemberRepository.kt
├── di/                                    # Hilt 依赖注入
│   ├── NetworkModule.kt
│   ├── DatabaseModule.kt
│   └── RepositoryModule.kt
├── domain/                                # 领域层
│   └── model/                             # 数据模型
│       ├── Product.kt
│       ├── Order.kt
│       └── Member.kt
├── hardware/                              # 硬件适配层
│   └── printer/
│       ├── PrinterManager.kt              # 打印机管理
│       ├── ReceiptBuilder.kt              # 小票生成
│       └── LabelBuilder.kt                # 标签生成
├── ui/                                    # UI 层
│   ├── screens/                           # 页面
│   │   ├── MainScreen.kt                  # 主页面+导航
│   │   ├── OrderScreen.kt                 # 点单页面
│   │   ├── OrdersScreen.kt                # 订单管理
│   │   ├── MemberScreen.kt                # 会员管理
│   │   ├── StatisticsScreen.kt            # 数据统计
│   │   ├── SettingsScreen.kt              # 设置页面
│   │   ├── CheckoutScreen.kt              # 结算页面
│   │   └── ScannerScreen.kt               # 扫码页面
│   ├── components/                        # 通用组件
│   │   ├── CartBadge.kt
│   │   ├── LoadingButton.kt
│   │   └── EmptyState.kt
│   ├── theme/                             # 主题
│   │   ├── Color.kt
│   │   ├── Theme.kt
│   │   └── Type.kt
│   └── viewmodel/                         # ViewModel
│       ├── OrderViewModel.kt
│       └── ProductViewModel.kt
├── utils/                                 # 工具类
│   ├── DateUtils.kt
│   └── PriceUtils.kt
└── MainActivity.kt                        # 主 Activity
```

## 功能模块

### 1. 现场点单
- 商品分类浏览（支持多级分类）
- 购物车管理（增删改查）
- 规格选择（糖度、冰度、配料）
- 会员识别（手机号/扫码）
- 多种支付方式（现金、微信、支付宝、储值）

### 2. 订单管理
- 实时订单列表（待制作/制作中/已完成）
- 订单状态快速更新
- 订单搜索筛选
- 重新打印小票/标签
- 订单详情查看

### 3. 会员管理
- 会员查询（手机号）
- 会员注册
- 余额充值
- 消费记录查询
- 会员等级折扣

### 4. 数据统计
- 今日营业概览
- 订单统计分析
- 支付方式占比
- 热销商品排行
- 时段销售分析

### 5. 打印功能
- USB 打印机连接
- 网络打印机连接
- 58mm/80mm 小票打印
- 40x30mm 杯贴标签打印
- 打印模板自定义

## 快速开始

### 环境要求

- Android Studio Hedgehog (2023.1.1) 或更高版本
- JDK 17
- Android SDK 34
- Gradle 8.2

### 1. 克隆项目

```bash
cd f:\奶茶店小程序\后台\backend\android-pos-app
```

### 2. 配置服务器

打开 `app/src/main/java/com/milktea/pos/data/remote/ApiConfig.kt`：

```kotlin
object ApiConfig {
    const val BASE_URL = "http://39.102.214.230:3000/api/"
    // ...
}
```

### 3. 同步项目

在 Android Studio 中：
- 点击工具栏的 **Sync Project with Gradle Files**（大象图标）
- 等待同步完成

### 4. 运行项目

- 连接美团点餐机或启动模拟器
- 点击运行按钮（▶️）

## API 接口

### 商品相关
```
GET    /api/products              # 获取商品列表
GET    /api/categories            # 获取分类列表
GET    /api/products/{id}         # 获取商品详情
```

### 订单相关
```
POST   /api/orders                # 创建订单
GET    /api/orders                # 获取订单列表
PUT    /api/orders/{id}/status    # 更新订单状态
POST   /api/orders/{id}/print     # 打印订单
```

### 会员相关
```
GET    /api/members/phone/{phone} # 查询会员
POST   /api/members               # 创建会员
POST   /api/members/{id}/recharge # 会员充值
```

### 统计相关
```
GET    /api/statistics/today      # 今日统计
```

### WebSocket
```
ws://39.102.214.230:3000/ws      # 实时通信
```

## 打印功能使用

### USB 打印

```kotlin
val printerManager = PrinterManager(context)

// 连接打印机
val result = printerManager.connectUsbPrinter(vid = 0x0483, pid = 0x5743)

// 打印小票
printerManager.printReceipt(order)

// 打印标签
items.forEachIndexed { index, item ->
    printerManager.printLabel(order, item, index + 1, items.size)
}
```

### 网络打印

```kotlin
// 连接网络打印机
printerManager.connectNetworkPrinter("192.168.1.100", 9100)

// 打印
printerManager.printReceipt(order)
```

## 开发指南

### 添加新页面

1. 在 `ui/screens/` 创建新的 Kotlin 文件
2. 使用 `@Composable` 注解创建页面函数
3. 在 `MainScreen.kt` 中添加导航路由

### 添加新 API

1. 在 `ApiService.kt` 中添加接口方法
2. 在对应的 Repository 中实现数据获取
3. 在 ViewModel 中调用 Repository 方法

### 添加数据库表

1. 在 `data/local/entity/` 创建实体类
2. 在 `data/local/dao/` 创建 DAO 接口
3. 在 `AppDatabase.kt` 中添加实体
4. 在 `DatabaseModule.kt` 中提供 DAO

## 常见问题

### 1. Gradle 同步失败

```
File → Invalidate Caches / Restart → Invalidate and Restart
```

### 2. 依赖下载慢

在 `gradle.properties` 中添加：
```properties
systemProp.http.proxyHost=mirrors.cloud.tencent.com
systemProp.https.proxyHost=mirrors.cloud.tencent.com
```

### 3. USB 打印机无法连接

- 检查 USB 权限是否授予（AndroidManifest.xml 中已声明）
- 确认打印机 VID/PID 是否正确
- 检查 USB 线是否连接正常

### 4. 网络请求失败

- 检查服务器地址配置
- 确认网络连接正常
- 检查服务器是否正常运行

## 版本历史

### v1.0.0 (2026-02-08)
- 初始版本发布
- 实现现场点单功能
- 实现订单管理功能
- 实现会员管理功能
- 实现数据统计功能
- 实现打印功能（USB + 网络）
- 实现 WebSocket 实时通信

## 待开发功能

- [ ] 多店铺支持
- [ ] 库存管理
- [ ] 员工权限管理
- [ ] 更多打印模板
- [ ] 数据备份恢复
- [ ] 离线订单同步

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请联系开发团队。

---

**项目地址**: `f:\奶茶店小程序\后台\backend\android-pos-app`  
**开发日期**: 2026-02-08  
**版本**: 1.0.0
