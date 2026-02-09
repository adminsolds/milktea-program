# 奶茶店安卓 POS 端 - 开发指南

## 项目概述

这是一个基于 Kotlin + Jetpack Compose 开发的奶茶店现场点单安卓应用。

## 技术栈

- **语言**: Kotlin
- **UI框架**: Jetpack Compose
- **架构**: MVVM + Repository Pattern
- **依赖注入**: Hilt
- **网络**: Retrofit + OkHttp
- **数据库**: Room
- **异步**: Kotlin Coroutines + Flow

## 项目结构

```
android-pos-app/
├── app/src/main/java/com/milktea/pos/
│   ├── app/                 # Application 类
│   ├── data/                # 数据层
│   │   ├── local/          # Room 数据库
│   │   ├── remote/         # Retrofit API
│   │   └── repository/     # 数据仓库
│   ├── di/                  # Hilt 依赖注入
│   ├── domain/              # 领域层
│   │   ├── model/          # 数据模型
│   │   └── usecase/        # 用例
│   ├── hardware/            # 硬件适配层
│   │   ├── printer/        # 打印机管理
│   │   └── scanner/        # 扫码枪
│   ├── ui/                  # UI 层
│   │   ├── screens/        # 页面
│   │   ├── components/     # 组件
│   │   ├── theme/          # 主题
│   │   └── viewmodel/      # ViewModel
│   └── utils/               # 工具类
└── docs/                    # 文档
```

## 开发环境

- Android Studio Hedgehog | 2023.1.1
- JDK 17
- Android SDK 34
- Gradle 8.2

## 快速开始

### 1. 打开项目

使用 Android Studio 打开 `android-pos-app` 文件夹。

### 2. 同步 Gradle

点击 "Sync Now" 同步项目依赖。

### 3. 配置服务器地址

修改 `data/remote/ApiConfig.kt`:

```kotlin
object ApiConfig {
    const val BASE_URL = "http://39.102.214.230:3000/api/"
}
```

### 4. 运行项目

连接设备或启动模拟器，点击运行按钮。

## 功能模块

### 1. 现场点单 (OrderScreen)

- 商品浏览（分类、搜索）
- 购物车管理
- 规格选择（糖度、冰度、配料）
- 会员识别
- 支付处理

### 2. 订单管理 (OrdersScreen)

- 实时订单列表
- 订单状态更新
- 订单搜索筛选
- 重新打印

### 3. 会员管理 (MemberScreen)

- 会员查询/注册
- 余额充值
- 消费记录

### 4. 数据统计 (StatisticsScreen)

- 今日营业统计
- 订单分析
- 商品销量排行

### 5. 设置 (SettingsScreen)

- 打印机设置
- 服务器配置
- 关于信息

## 打印功能

### USB 打印

```kotlin
val printerManager = PrinterManager(context)

// 获取可用打印机
val printers = printerManager.getAvailableUsbPrinters()

// 请求权限并连接
printerManager.requestUsbPermission(printers[0])

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

## 数据库

### 表结构

- `products` - 商品表
- `orders` - 订单表
- `order_items` - 订单商品表
- `members` - 会员表

### 使用 Room

```kotlin
@Dao
interface ProductDao {
    @Query("SELECT * FROM products WHERE isActive = 1")
    fun getActiveProducts(): Flow<List<Product>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(products: List<Product>)
}
```

## 开发规范

### 命名规范

- **类名**: PascalCase (如: `OrderViewModel`)
- **函数名**: camelCase (如: `getOrders()`)
- **变量名**: camelCase (如: `orderList`)
- **常量名**: SCREAMING_SNAKE_CASE (如: `BASE_URL`)

### 代码组织

- 一个文件一个类
- 相关功能放在同一包下
- 使用数据类传递数据

### 错误处理

```kotlin
viewModelScope.launch {
    try {
        val result = repository.getOrders()
        _orders.value = result
    } catch (e: Exception) {
        _error.value = e.message
        Timber.e(e, "Failed to load orders")
    }
}
```

## 测试

### 单元测试

```kotlin
@Test
fun `calculate total price correctly`() {
    val item = CartItem(product, 2)
    assertEquals(56.0, item.totalPrice, 0.01)
}
```

### UI 测试

```kotlin
@Test
fun orderScreen_displaysProducts() {
    composeTestRule.setContent {
        OrderScreen()
    }
    composeTestRule.onNodeWithText("商品名称").assertIsDisplayed()
}
```

## 构建发布

### 调试版本

```bash
./gradlew assembleDebug
```

### 发布版本

```bash
./gradlew assembleRelease
```

### 签名配置

在 `app/build.gradle.kts` 中配置签名信息：

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("my-release-key.jks")
            storePassword = "password"
            keyAlias = "my-alias"
            keyPassword = "password"
        }
    }
    
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

## 常见问题

### 1. USB 打印机无法连接

- 检查 USB 权限是否授予
- 确认打印机驱动是否正确
- 检查 USB 线是否连接正常

### 2. 网络请求失败

- 检查网络连接
- 确认服务器地址配置正确
- 检查服务器是否正常运行

### 3. 编译错误

- 同步 Gradle
- 清理项目: `Build > Clean Project`
- 重建项目: `Build > Rebuild Project`

## 更新日志

### v1.0.0 (2026-02-08)

- 初始版本发布
- 实现现场点单功能
- 实现订单管理功能
- 实现会员管理功能
- 实现数据统计功能
- 实现打印功能

## 技术支持

如有问题，请联系开发团队。
