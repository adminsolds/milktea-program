# 奶茶店小程序后台 API 文档

## 目录

- [基础信息](#基础信息)
- [API 接口列表](#api-接口列表)
- [数据库表结构](#数据库表结构)
- [打印服务](#打印服务)

---

## 基础信息

- **服务器地址**: `http://39.102.214.230:3003`
- **API 基础路径**: `/api`
- **完整 API 地址**: `http://39.102.214.230:3003/api`

---

## API 接口列表

### 一、分类接口

| 接口名称 | 请求方式 | 路径 | 请求参数 | 返回字段 | 说明 |
|---------|---------|------|---------|---------|------|
| 获取分类列表 | GET | `/api/products/categories` | 无 | id, name, desc, icon, sort_order, is_active | 获取所有激活的商品分类 |
| 创建分类 | POST | `/api/products/categories` | name(必填), desc, icon, sort_order | id, name, desc, icon, sort_order, is_active | 创建新的商品分类 |
| 更新分类 | PUT | `/api/products/categories/:id` | name, desc, icon, sort_order, is_active | id, name, desc, icon, sort_order, is_active | 更新分类信息 |
| 删除分类 | DELETE | `/api/products/categories/:id` | 无 | message | 删除分类（需确保无关联商品） |

---

### 二、商品接口

| 接口名称 | 请求方式 | 路径 | 请求参数 | 返回字段 | 说明 |
|---------|---------|------|---------|---------|------|
| 获取商品列表 | GET | `/api/products` | category_id, page, limit, is_new, is_recommended | total, page, limit, products[] | 分页获取商品列表，支持筛选 |
| 获取商品详情 | GET | `/api/products/:id` | 无 | 商品完整信息（含规格） | 获取单个商品的详细信息 |
| 创建商品 | POST | `/api/products` | category_id(必填), name(必填), desc, price_small, price_medium, price_large, delivery_fee, image, tags, is_new, is_recommended, enable_toppings, enable_size_small, enable_size_medium, enable_size_large, enable_ice, enable_sugar | 商品完整信息 | 创建新商品（至少一个杯型价格） |
| 更新商品 | PUT | `/api/products/:id` | 同创建商品 | 商品完整信息 | 更新商品信息 |
| 删除商品 | DELETE | `/api/products/:id` | 无 | message | 删除商品 |
| 获取商品规格 | GET | `/api/products/:id/specs` | 无 | 规格数组 | 获取商品的所有规格选项 |
| 创建商品规格 | POST | `/api/products/:id/specs` | type(必填), name(必填), price, is_required | 规格信息 | 为商品添加规格选项 |
| 更新商品规格 | PUT | `/api/products/specs/:specId` | type, name, price, is_required | 规格信息 | 更新商品规格 |
| 删除商品规格 | DELETE | `/api/products/specs/:specId` | 无 | message | 删除商品规格 |
| 批量更新规格 | POST | `/api/products/:id/specs/batch` | specs[](必填), applyToGlobal | 新规格数组或应用结果 | 批量更新商品规格，可应用至全局 |

**商品列表返回字段说明**:
```json
{
  "total": 100,
  "page": 1,
  "limit": 10,
  "products": [
    {
      "id": 1,
      "name": "珍珠奶茶",
      "desc": "经典奶茶",
      "price": 15.00,
      "price_small": 12.00,
      "price_medium": 15.00,
      "price_large": 18.00,
      "delivery_fee": 0.00,
      "image": "图片URL",
      "tags": "热销",
      "is_new": 1,
      "is_recommended": 1,
      "enable_toppings": 1,
      "enable_size_small": 1,
      "enable_size_medium": 1,
      "enable_size_large": 1,
      "enable_ice": 1,
      "enable_sugar": 1,
      "sizes": [
        { "name": "小杯", "price": 12.00 },
        { "name": "中杯", "price": 15.00 },
        { "name": "大杯", "price": 18.00 }
      ],
      "specs": ["正常冰", "少冰", "去冰"],
      "sugars": ["无糖", "三分糖", "五分糖", "七分糖", "全糖"],
      "toppings": [
        { "name": "珍珠", "price": 2.00 },
        { "name": "椰果", "price": 2.00 }
      ],
      "is_active": true,
      "category": {
        "id": 1,
        "name": "奶茶"
      }
    }
  ]
}
```

---

### 三、订单接口

| 接口名称 | 请求方式 | 路径 | 请求参数 | 返回字段 | 说明 |
|---------|---------|------|---------|---------|------|
| 获取订单列表 | GET | `/api/orders` | user_id, status, page, limit, startDate, endDate, source, is_pos | total, page, limit, orders[] | 分页获取订单列表，支持多条件筛选 |
| 获取订单详情 | GET | `/api/orders/:id` | 无 | 订单完整信息（含商品、用户、店铺） | 获取单个订单的详细信息 |
| 创建订单 | POST | `/api/orders` | store_id(必填), product_total(必填), payment_method(必填), items[](必填), user_id, remark, delivery_fee, discount, coupon_id, phone, order_type, platform_code, receiver_name, receiver_phone, receiver_address, receiver_lat, receiver_lng, is_pickup, pickup_time, pickup_minutes, is_pos, member_discount | 订单完整信息 | 创建新订单，支持自取、外卖、现场点单 |
| 更新订单状态 | PUT | `/api/orders/:id/status` | status(必填) | 订单信息 | 更新订单状态（0已取消,1已下单,2制作中,3制作完成,4配送中/待取餐,5已完成,6已送达） |
| 订单退款 | POST | `/api/orders/:id/refund` | reason | success, message, refund_amount, new_balance | 退款到用户余额并恢复优惠券 |
| 获取订单统计 | GET | `/api/orders/stats` | startDate, endDate, source | count, amount | 获取订单数量和金额统计 |

**订单状态说明**:
- `0`: 已取消
- `1`: 已下单
- `2`: 制作中
- `3`: 制作完成
- `4`: 配送中/待取餐
- `5`: 已完成
- `6`: 已送达

**创建订单请求示例**:
```json
{
  "user_id": 1,
  "store_id": 1,
  "product_total": 30.00,
  "delivery_fee": 5.00,
  "discount": 0,
  "coupon_id": null,
  "payment_method": "wechat",
  "phone": "13800138000",
  "remark": "少糖",
  "items": [
    {
      "product_id": 1,
      "product_name": "珍珠奶茶",
      "price": 15.00,
      "quantity": 2,
      "spec": "中杯",
      "sugar": "七分糖",
      "ice": "少冰",
      "toppings": ["珍珠"],
      "product_image": "图片URL"
    }
  ],
  "order_type": "self",
  "is_pickup": false
}
```

**订单列表返回字段说明**:
```json
{
  "total": 100,
  "page": 1,
  "limit": 10,
  "orders": [
    {
      "id": 1,
      "order_no": "MX1707571234567",
      "user_id": 1,
      "store_id": 1,
      "product_total": 30.00,
      "delivery_fee": 5.00,
      "discount": 0,
      "member_discount": 0,
      "final_price": 35.00,
      "full_payment_amount": 35.00,
      "coupon_id": null,
      "payment_method": "wechat",
      "status": 1,
      "phone": "13800138000",
      "order_type": "self",
      "remark": "少糖",
      "userName": "张三",
      "userPhone": "13800138000",
      "storeName": "奶茶店总店",
      "storeAddress": "北京市朝阳区",
      "storePhone": "010-12345678",
      "items": [
        {
          "id": 1,
          "order_id": 1,
          "product_id": 1,
          "product_name": "珍珠奶茶",
          "price": 15.00,
          "quantity": 2,
          "spec": "中杯",
          "sugar": "七分糖",
          "ice": "少冰",
          "toppings": ["珍珠"]
        }
      ],
      "createdAt": "2024-02-10T12:34:56.000Z",
      "updatedAt": "2024-02-10T12:34:56.000Z",
      "payTime": null,
      "completeTime": null
    }
  ]
}
```

---

### 四、支付接口

| 接口名称 | 请求方式 | 路径 | 请求参数 | 返回字段 | 说明 |
|---------|---------|------|---------|---------|------|
| 创建支付订单 | POST | `/api/payment/create` | orderId(必填), openid(必填) | timeStamp, nonceStr, package, signType, paySign, orderId | 创建微信支付订单，返回小程序支付参数 |
| 查询支付状态 | GET | `/api/payment/query/:orderId` | 无 | orderId, status, paymentStatus, paymentTime | 查询订单的支付状态 |
| 申请退款 | POST | `/api/payment/refund` | orderId, refundAmount, reason | success, message | 申请订单退款 |
| 微信支付通知回调 | POST | `/api/payment/wechat/notify` | 微信支付XML数据 | XML响应 | 微信支付服务器回调接口，处理支付结果 |
| 获取支付配置状态 | GET | `/api/payment/config/status` | 无 | configured, missing, message | 查询微信支付配置状态 |

**创建支付订单请求示例**:
```json
{
  "orderId": "MX1707571234567",
  "openid": "o6_bmjrPTlm6_2sgVt7hMZOPfL2M"
}
```

**创建支付订单返回示例**:
```json
{
  "success": true,
  "timeStamp": "1707571234",
  "nonceStr": "abc123def456",
  "package": "prepay_id=wx1234567890123456",
  "signType": "MD5",
  "paySign": "ABCDEF1234567890",
  "orderId": "MX1707571234567"
}
```

**查询支付状态返回示例**:
```json
{
  "orderId": "MX1707571234567",
  "status": "paid",
  "paymentStatus": "paid",
  "paymentTime": "2024-02-10T12:35:00.000Z"
}
```

---

## 数据库表结构

### 核心表

#### users (用户表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| openid | STRING | 微信openid |
| nickname | STRING | 昵称 |
| avatar_url | STRING | 头像 |
| phone | STRING | 手机号 |
| member_level | INTEGER | 会员等级 |
| balance | DECIMAL | 余额 |
| points | INTEGER | 积分 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### admins (管理员表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| username | STRING | 用户名 |
| password | STRING | 密码(加密) |
| role | STRING | 角色 |
| last_login | DATETIME | 最后登录 |
| created_at | DATETIME | 创建时间 |

#### stores (店铺表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| name | STRING | 店铺名称 |
| address | STRING | 地址 |
| phone | STRING | 电话 |
| business_hours | STRING | 营业时间 |
| status | INTEGER | 状态 |
| created_at | DATETIME | 创建时间 |

---

### 商品相关表

#### categories (商品分类表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| name | STRING | 分类名称 |
| sort_order | INTEGER | 排序 |
| status | INTEGER | 状态 |

#### products (商品表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| name | STRING | 商品名称 |
| description | TEXT | 描述 |
| price | DECIMAL | 价格 |
| category_id | INTEGER | 分类ID |
| image_url | STRING | 图片 |
| status | INTEGER | 状态(1上架,0下架) |
| sort_order | INTEGER | 排序 |
| created_at | DATETIME | 创建时间 |

#### product_specs (商品规格表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| product_id | INTEGER | 商品ID |
| name | STRING | 规格名称(如:温度,糖度) |
| options | JSON | 选项(如:["少冰","正常冰"]) |
| price_adjustment | DECIMAL | 价格调整 |

---

### 订单相关表

#### orders (订单表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| order_no | STRING | 订单号 |
| user_id | INTEGER | 用户ID |
| status | STRING | 状态 |
| subtotal | DECIMAL | 小计 |
| discount | DECIMAL | 优惠金额 |
| delivery_fee | DECIMAL | 配送费 |
| total | DECIMAL | 总计 |
| pay_type | STRING | 支付方式 |
| pay_status | STRING | 支付状态 |
| pay_time | DATETIME | 支付时间 |
| remark | TEXT | 备注 |
| is_pos | INTEGER | 是否POS订单 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### order_items (订单商品表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| order_id | INTEGER | 订单ID |
| product_id | INTEGER | 商品ID |
| product_name | STRING | 商品名称 |
| price | DECIMAL | 单价 |
| quantity | INTEGER | 数量 |
| specs | JSON | 规格选项 |
| subtotal | DECIMAL | 小计 |

---

### 优惠券相关表

#### coupons (优惠券表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| name | STRING | 优惠券名称 |
| type | STRING | 类型(满减/折扣) |
| value | DECIMAL | 优惠值 |
| min_amount | DECIMAL | 最低消费 |
| total_quantity | INTEGER | 总数量 |
| remaining_quantity | INTEGER | 剩余数量 |
| start_time | DATETIME | 开始时间 |
| end_time | DATETIME | 结束时间 |
| status | INTEGER | 状态 |

#### user_coupons (用户优惠券表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户ID |
| coupon_id | INTEGER | 优惠券ID |
| status | STRING | 状态(未使用/已使用/已过期) |
| used_at | DATETIME | 使用时间 |
| order_id | INTEGER | 使用订单ID |
| created_at | DATETIME | 领取时间 |

---

### 会员相关表

#### member_levels (会员等级表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| name | STRING | 等级名称 |
| min_points | INTEGER | 最低积分 |
| max_points | INTEGER | 最高积分 |
| discount | DECIMAL | 折扣率 |
| benefits | JSON | 权益 |

#### recharge_plans (储值方案表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| name | STRING | 方案名称 |
| amount | DECIMAL | 储值金额 |
| bonus | DECIMAL | 赠送金额 |
| status | INTEGER | 状态 |

#### recharge_records (储值记录表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户ID |
| plan_id | INTEGER | 方案ID |
| amount | DECIMAL | 储值金额 |
| bonus | DECIMAL | 赠送金额 |
| pay_type | STRING | 支付方式 |
| status | STRING | 状态 |
| created_at | DATETIME | 创建时间 |

#### balance_records (余额记录表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户ID |
| type | STRING | 类型(充值/消费/退款) |
| amount | DECIMAL | 金额 |
| balance | DECIMAL | 变动后余额 |
| remark | STRING | 备注 |
| order_id | INTEGER | 关联订单ID |
| created_at | DATETIME | 创建时间 |

---

### 团购相关表

#### group_buys (团购活动表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| name | STRING | 团购名称 |
| desc | TEXT | 描述 |
| image | STRING | 图片 |
| original_price | DECIMAL | 原价 |
| groupon_price | DECIMAL | 团购价 |
| min_participants | INTEGER | 最少人数 |
| max_participants | INTEGER | 最多人数 |
| current_participants | INTEGER | 当前人数 |
| start_time | DATETIME | 开始时间 |
| end_time | DATETIME | 结束时间 |
| status | STRING | 状态 |
| is_active | INTEGER | 是否激活 |
| sort_order | INTEGER | 排序 |
| created_at | DATETIME | 创建时间 |

#### group_buy_participants (团购参与者表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| group_buy_id | INTEGER | 团购ID |
| user_id | INTEGER | 用户ID |
| quantity | INTEGER | 购买数量 |
| is_leader | INTEGER | 是否团长 |
| join_time | DATETIME | 参团时间 |

---

### 配送相关表

#### delivery_platforms (配送平台表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| name | STRING | 平台名称 |
| code | STRING | 平台代码 |
| config | JSON | 配置信息 |
| status | INTEGER | 状态 |

#### addresses (地址表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| user_id | INTEGER | 用户ID |
| name | STRING | 联系人 |
| phone | STRING | 电话 |
| address | STRING | 详细地址 |
| is_default | INTEGER | 是否默认 |

---

### 配置相关表

#### system_configs (系统配置表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| key | STRING | 配置键 |
| value | TEXT | 配置值 |
| description | STRING | 描述 |

#### banners (轮播图表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| title | STRING | 标题 |
| image_url | STRING | 图片URL |
| link_url | STRING | 链接URL |
| sort_order | INTEGER | 排序 |
| status | INTEGER | 状态 |

#### function_entries (功能入口表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| name | STRING | 名称 |
| icon | STRING | 图标 |
| link | STRING | 链接 |
| sort_order | INTEGER | 排序 |
| status | INTEGER | 状态 |

#### tab_bar_icons (TabBar图标表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| page_path | STRING | 页面路径 |
| text | STRING | 文字 |
| icon_path | STRING | 图标路径 |
| selected_icon_path | STRING | 选中图标路径 |
| sort_order | INTEGER | 排序 |

---

### 活动相关表

#### activities (活动表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| title | STRING | 活动标题 |
| type | STRING | 活动类型 |
| content | TEXT | 活动内容 |
| start_time | DATETIME | 开始时间 |
| end_time | DATETIME | 结束时间 |
| status | INTEGER | 状态 |

#### member_activities (会员活动表)
| 字段 | 类型 | 说明 |
|-----|------|------|
| id | INTEGER | 主键 |
| title | STRING | 标题 |
| description | TEXT | 描述 |
| points_required | INTEGER | 所需积分 |
| reward_points | INTEGER | 奖励积分 |
| start_time | DATETIME | 开始时间 |
| end_time | DATETIME | 结束时间 |
| status | INTEGER | 状态 |

---

## 打印服务

### 概述

后台系统支持网络打印功能，可以直接通过网络发送 ESC/POS 指令到打印机。

### 打印机配置

在服务器上设置环境变量：
```bash
export PRINTER_HOST=192.168.1.100
export PRINTER_PORT=9100
```

### 打印流程

1. 订单创建后，调用 `/api/print/order/:id` 接口
2. 后台系统通过网络发送打印指令到打印机
3. 打印机自动打印小票

### 小票格式

- 店铺名称（居中，大字）
- 订单号、时间
- 商品列表（名称、数量、金额）
- 小计、优惠、实付金额
- 支付方式
- 二维码（可选）
- 结束语

---

## 更新日志

### 2024-02-10
- 添加打印服务接口
- 添加网络打印功能
- 更新 API 文档
