# 奶茶店小程序后台系统

## 项目简介

奶茶店小程序后台系统是为奶茶店小程序提供服务的后端系统，包含商品管理、订单管理、用户管理、优惠券管理、店铺管理、UI管理和数据统计等功能。

## 技术栈

- **后端框架**: Node.js + Express.js
- **数据库**: MySQL
- **ORM**: Sequelize
- **认证**: JWT (JSON Web Token)
- **API文档**: Swagger
- **前端框架**: Bootstrap 5 (后台管理系统)

## 项目结构

```
backend/
├── config/              # 配置文件
│   └── db.js            # 数据库配置
├── controllers/         # 控制器
│   ├── couponController.js    # 优惠券控制器
│   ├── orderController.js     # 订单控制器
│   ├── productController.js   # 商品控制器
│   ├── statsController.js     # 统计控制器
│   ├── storeController.js     # 店铺控制器
│   ├── uiController.js        # UI控制器
│   └── userController.js      # 用户控制器
├── models/              # 数据库模型
│   ├── Banner.js               # 轮播图模型
│   ├── Category.js             # 分类模型
│   ├── Coupon.js               # 优惠券模型
│   ├── FunctionEntry.js        # 功能入口模型
│   ├── NewProduct.js           # 新品推荐模型
│   ├── Order.js                # 订单模型
│   ├── OrderItem.js            # 订单商品模型
│   ├── Product.js              # 商品模型
│   ├── ProductSpec.js          # 商品规格模型
│   ├── Store.js                # 店铺模型
│   ├── User.js                 # 用户模型
│   ├── UserCoupon.js           # 用户优惠券模型
│   └── index.js                # 模型索引
├── routes/              # 路由
│   ├── couponRoutes.js         # 优惠券路由
│   ├── index.js               # 路由索引
│   ├── orderRoutes.js          # 订单路由
│   ├── productRoutes.js        # 商品路由
│   ├── statsRoutes.js          # 统计路由
│   ├── storeRoutes.js          # 店铺路由
│   ├── uiRoutes.js             # UI路由
│   └── userRoutes.js           # 用户路由
├── views/               # 视图
│   └── login.html              # 登录页面
├── public/              # 公共资源
│   ├── css/                    # CSS文件
│   ├── js/                     # JavaScript文件
│   └── images/                 # 图片文件
├── uploads/             # 上传文件目录
├── .env                 # 环境变量
├── app.js               # 入口文件
├── package.json         # 项目配置
└── README.md            # 项目文档
```

## 安装说明

### 环境要求

- Node.js 14.x 或更高版本
- MySQL 5.7 或更高版本

### 安装步骤

1. **克隆项目**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **配置环境变量**

   复制 `.env.example` 文件为 `.env`，并修改其中的配置：

   ```bash
   cp .env.example .env
   ```

   配置项说明：
   ```
   # 数据库配置
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=milktea_shop

   # 服务器配置
   PORT=3000

   # JWT配置
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d

   # 上传配置
   UPLOAD_PATH=./uploads
   ```

4. **创建数据库**

   ```bash
   mysql -u root -p
   CREATE DATABASE milktea_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

5. **启动项目**

   ```bash
   # 开发模式
   npm run dev
   
   # 生产模式
   npm start
   ```

6. **访问项目**

   - API地址: http://localhost:3000/api
   - 健康检查: http://localhost:3000/api/health
   - 后台管理系统: http://localhost:3000

## API文档

### 健康检查

- **GET** `/api/health`
  - 描述: 健康检查接口
  - 返回: 服务器状态信息

### 用户相关API

- **POST** `/api/users/login`
  - 描述: 用户登录
  - 请求体: `{ openid, phone, nickname, avatar }`
  - 返回: JWT令牌和用户信息

- **GET** `/api/users/profile`
  - 描述: 获取用户信息
  - 返回: 用户详细信息

- **PUT** `/api/users/profile`
  - 描述: 更新用户信息
  - 请求体: `{ phone, nickname, avatar }`
  - 返回: 更新后的用户信息

- **GET** `/api/users/points`
  - 描述: 获取用户积分
  - 返回: 用户积分信息

### 商品相关API

- **GET** `/api/products`
  - 描述: 获取商品列表
  - 查询参数: `category_id`, `page`, `limit`, `is_new`, `is_recommended`
  - 返回: 商品列表

- **GET** `/api/products/:id`
  - 描述: 获取商品详情
  - 返回: 商品详细信息

- **POST** `/api/products`
  - 描述: 创建商品
  - 请求体: `{ category_id, name, desc, price, image, tags, is_new, is_recommended }`
  - 返回: 创建的商品信息

- **PUT** `/api/products/:id`
  - 描述: 更新商品
  - 请求体: `{ category_id, name, desc, price, image, tags, is_new, is_recommended }`
  - 返回: 更新后的商品信息

- **DELETE** `/api/products/:id`
  - 描述: 删除商品
  - 返回: 删除结果

### 分类相关API

- **GET** `/api/products/categories`
  - 描述: 获取分类列表
  - 返回: 分类列表

- **POST** `/api/products/categories`
  - 描述: 创建分类
  - 请求体: `{ name, desc, icon, sort_order }`
  - 返回: 创建的分类信息

- **PUT** `/api/products/categories/:id`
  - 描述: 更新分类
  - 请求体: `{ name, desc, icon, sort_order, is_active }`
  - 返回: 更新后的分类信息

- **DELETE** `/api/products/categories/:id`
  - 描述: 删除分类
  - 返回: 删除结果

### 订单相关API

- **GET** `/api/orders`
  - 描述: 获取订单列表
  - 查询参数: `user_id`, `status`, `page`, `limit`
  - 返回: 订单列表

- **GET** `/api/orders/:id`
  - 描述: 获取订单详情
  - 返回: 订单详细信息

- **POST** `/api/orders`
  - 描述: 创建订单
  - 请求体: `{ user_id, store_id, remark, product_total, delivery_fee, discount, member_discount, final_price, coupon_id, payment_method, phone, items }`
  - 返回: 创建的订单信息

- **PUT** `/api/orders/:id/status`
  - 描述: 更新订单状态
  - 请求体: `{ status }`
  - 返回: 更新后的订单信息

### 优惠券相关API

- **GET** `/api/coupons`
  - 描述: 获取优惠券列表
  - 查询参数: `is_active`, `is_system`, `page`, `limit`
  - 返回: 优惠券列表

- **GET** `/api/coupons/:id`
  - 描述: 获取优惠券详情
  - 返回: 优惠券详细信息

- **POST** `/api/coupons`
  - 描述: 创建优惠券
  - 请求体: `{ title, desc, amount, type, min_amount, start_time, end_time, is_system }`
  - 返回: 创建的优惠券信息

- **PUT** `/api/coupons/:id`
  - 描述: 更新优惠券
  - 请求体: `{ title, desc, amount, type, min_amount, start_time, end_time, is_system, is_active }`
  - 返回: 更新后的优惠券信息

- **DELETE** `/api/coupons/:id`
  - 描述: 删除优惠券
  - 返回: 删除结果

- **GET** `/api/coupons/users/:userId`
  - 描述: 获取用户优惠券
  - 查询参数: `is_used`, `page`, `limit`
  - 返回: 用户优惠券列表

- **POST** `/api/coupons/users/:userId/:couponId`
  - 描述: 给用户发放优惠券
  - 返回: 发放结果

### 店铺相关API

- **GET** `/api/stores`
  - 描述: 获取店铺列表
  - 查询参数: `is_active`, `page`, `limit`
  - 返回: 店铺列表

- **GET** `/api/stores/:id`
  - 描述: 获取店铺详情
  - 返回: 店铺详细信息

- **POST** `/api/stores`
  - 描述: 创建店铺
  - 请求体: `{ name, address, phone }`
  - 返回: 创建的店铺信息

- **PUT** `/api/stores/:id`
  - 描述: 更新店铺
  - 请求体: `{ name, address, phone, is_active }`
  - 返回: 更新后的店铺信息

### UI相关API

#### 轮播图

- **GET** `/api/ui/banners`
  - 描述: 获取轮播图列表
  - 查询参数: `position`, `is_active`, `page`, `limit`
  - 返回: 轮播图列表

- **GET** `/api/ui/banners/:id`
  - 描述: 获取轮播图详情
  - 返回: 轮播图详细信息

- **POST** `/api/ui/banners`
  - 描述: 创建轮播图
  - 请求体: `{ title, image, link, position, sort_order, is_active, start_time, end_time }`
  - 返回: 创建的轮播图信息

- **PUT** `/api/ui/banners/:id`
  - 描述: 更新轮播图
  - 请求体: `{ title, image, link, position, sort_order, is_active, start_time, end_time }`
  - 返回: 更新后的轮播图信息

- **DELETE** `/api/ui/banners/:id`
  - 描述: 删除轮播图
  - 返回: 删除结果

#### 功能入口

- **GET** `/api/ui/function-entries`
  - 描述: 获取功能入口列表
  - 查询参数: `is_active`, `page`, `limit`
  - 返回: 功能入口列表

- **GET** `/api/ui/function-entries/:id`
  - 描述: 获取功能入口详情
  - 返回: 功能入口详细信息

- **POST** `/api/ui/function-entries`
  - 描述: 创建功能入口
  - 请求体: `{ name, desc, type, icon, link, sort_order, is_active }`
  - 返回: 创建的功能入口信息

- **PUT** `/api/ui/function-entries/:id`
  - 描述: 更新功能入口
  - 请求体: `{ name, desc, type, icon, link, sort_order, is_active }`
  - 返回: 更新后的功能入口信息

- **DELETE** `/api/ui/function-entries/:id`
  - 描述: 删除功能入口
  - 返回: 删除结果

#### 新品推荐

- **GET** `/api/ui/new-products`
  - 描述: 获取新品推荐列表
  - 查询参数: `is_active`, `page`, `limit`
  - 返回: 新品推荐列表

- **GET** `/api/ui/new-products/:id`
  - 描述: 获取新品推荐详情
  - 返回: 新品推荐详细信息

- **POST** `/api/ui/new-products`
  - 描述: 创建新品推荐
  - 请求体: `{ product_id, sort_order, is_active }`
  - 返回: 创建的新品推荐信息

- **PUT** `/api/ui/new-products/:id`
  - 描述: 更新新品推荐
  - 请求体: `{ sort_order, is_active }`
  - 返回: 更新后的新品推荐信息

- **DELETE** `/api/ui/new-products/:id`
  - 描述: 删除新品推荐
  - 返回: 删除结果

### 数据统计相关API

- **GET** `/api/stats/sales`
  - 描述: 获取销售统计
  - 查询参数: `start_date`, `end_date`, `group_by`
  - 返回: 销售统计数据

- **GET** `/api/stats/orders`
  - 描述: 获取订单统计
  - 查询参数: `start_date`, `end_date`
  - 返回: 订单统计数据

- **GET** `/api/stats/products`
  - 描述: 获取商品统计
  - 查询参数: `start_date`, `end_date`, `limit`
  - 返回: 商品统计数据

- **GET** `/api/stats/users`
  - 描述: 获取用户统计
  - 查询参数: `start_date`, `end_date`
  - 返回: 用户统计数据

## 数据库设计

### 核心数据表

- **users**: 用户表
- **categories**: 商品分类表
- **products**: 商品表
- **product_specs**: 商品规格表
- **stores**: 店铺表
- **orders**: 订单表
- **order_items**: 订单商品表
- **coupons**: 优惠券表
- **user_coupons**: 用户优惠券表
- **banners**: 轮播图表
- **function_entries**: 功能入口表
- **new_products**: 新品推荐表

详细的数据库设计请参考 `models/` 目录下的模型文件。

## 后台管理系统

后台管理系统采用 Bootstrap 5 开发，包含以下功能：

- 登录页面
- 仪表盘
- 商品管理
  - 分类管理
  - 商品列表
  - 商品详情编辑
  - 商品上下架
- 订单管理
  - 订单列表
  - 订单详情
  - 订单状态更新
  - 订单导出
- 会员管理
  - 会员列表
  - 会员等级管理
  - 积分管理
  - 会员活动
- 优惠券管理
  - 优惠券列表
  - 优惠券创建
  - 优惠券发放
  - 优惠券统计
- 店铺管理
  - 店铺信息编辑
  - 营业时间设置
- UI管理
  - 轮播图管理
  - 功能入口管理
  - 新品推荐管理
  - 页面配置管理
- 数据统计
  - 销售报表
  - 商品销量排行
  - 用户消费分析
  - 流量分析

## 开发说明

### 代码规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 RESTful API 设计规范

### 开发流程

1. 创建分支
2. 开发功能
3. 编写测试
4. 提交代码
5. 创建 Pull Request
6. 代码审查
7. 合并代码

### 部署说明

1. 配置环境变量
2. 安装依赖
3. 构建项目
4. 启动服务

## 安全设计

1. **数据加密**: 敏感数据（如密码）使用 bcrypt 加密存储
2. **API认证**: 所有 API 接口使用 JWT 认证
3. **请求频率限制**: 防止恶意请求
4. **SQL注入防护**: 使用 ORM 和参数化查询
5. **XSS防护**: 对输入数据进行过滤和转义

## 性能优化

1. **数据库索引**: 为常用查询字段创建索引
2. **缓存机制**: 使用 Redis 缓存热点数据
3. **异步处理**: 使用消息队列处理耗时操作
4. **代码优化**: 减少不必要的数据库查询和计算
5. **图片优化**: 图片进行压缩和 CDN 加速

## 许可证

ISC

## 联系方式

如有问题，请联系开发团队。