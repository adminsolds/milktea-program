# 微信小程序后台接入配送平台配置文档

## 一、接入前准备

### 1.1 获取接入凭证

联系配送平台管理员，获取以下信息：

```json
{
  "platform_code": "wx_miniprogram_001",
  "api_key": "ak_wx_xxxxxxxxxxxxxxxx",
  "api_secret": "sk_wx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "api_base_url": "https://delivery-platform.com/api/external"
}
```

### 1.2 配置服务器域名

在微信小程序后台配置服务器域名：

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「开发」→「开发管理」→「开发设置」
3. 在「服务器域名」中添加：
   - request合法域名：`https://delivery-platform.com`

### 1.3 提供回调地址

向配送平台提供你的回调地址：

```
https://你的小程序后台域名.com/api/delivery/callback
```

**示例：**
- 开发环境：`https://dev-api.yourapp.com/api/delivery/callback`
- 生产环境：`https://api.yourapp.com/api/delivery/callback`

---

## 二、环境配置

### 2.1 安装依赖

```bash
npm install axios crypto-js
```

### 2.2 配置文件

创建 `config/delivery.js`：

```javascript
/**
 * 配送平台配置
 */
module.exports = {
  // 配送平台API地址
  baseUrl: process.env.DELIVERY_API_URL || 'https://delivery-platform.com/api/external',
  
  // 平台代码（从配送平台获取）
  platformCode: process.env.DELIVERY_PLATFORM_CODE || 'wx_miniprogram_001',
  
  // API密钥（从配送平台获取）
  apiKey: process.env.DELIVERY_API_KEY,
  apiSecret: process.env.DELIVERY_API_SECRET,
  
  // 回调地址（你的服务器地址）
  callbackUrl: process.env.DELIVERY_CALLBACK_URL,
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 是否启用配送
  enabled: true
};
```

### 2.3 环境变量

在项目根目录创建 `.env` 文件：

```bash
# 配送平台配置
DELIVERY_API_URL=https://delivery-platform.com/api/external
DELIVERY_PLATFORM_CODE=wx_miniprogram_001
DELIVERY_API_KEY=ak_wx_xxxxxxxxxxxxxxxx
DELIVERY_API_SECRET=sk_wx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DELIVERY_CALLBACK_URL=https://api.yourapp.com/api/delivery/callback
```

**生产环境配置：**

在生产服务器上设置环境变量：

```bash
# Linux/Mac
export DELIVERY_API_URL=https://delivery-platform.com/api/external
export DELIVERY_PLATFORM_CODE=wx_miniprogram_001
export DELIVERY_API_KEY=ak_wx_xxxxxxxxxxxxxxxx
export DELIVERY_API_SECRET=sk_wx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export DELIVERY_CALLBACK_URL=https://api.yourapp.com/api/delivery/callback

# Windows PowerShell
$env:DELIVERY_API_URL="https://delivery-platform.com/api/external"
$env:DELIVERY_PLATFORM_CODE="wx_miniprogram_001"
$env:DELIVERY_API_KEY="ak_wx_xxxxxxxxxxxxxxxx"
$env:DELIVERY_API_SECRET="sk_wx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
$env:DELIVERY_CALLBACK_URL="https://api.yourapp.com/api/delivery/callback"
```

---

## 三、核心代码实现

### 3.1 配送服务类

创建 `services/deliveryService.js`：

```javascript
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/delivery');

/**
 * 配送服务类
 */
class DeliveryService {
  constructor() {
    this.baseUrl = config.baseUrl;
    this.platformCode = config.platformCode;
    this.apiSecret = config.apiSecret;
    this.callbackUrl = config.callbackUrl;
    this.timeout = config.timeout;
  }

  /**
   * 发送订单到配送平台
   * @param {Object} orderData 订单数据
   * @returns {Promise<Object>} 配送订单信息
   */
  async createOrder(orderData) {
    try {
      const requestData = {
        platform_code: this.platformCode,
        api_secret: this.apiSecret,
        external_order_no: orderData.orderNo,
        merchant_name: orderData.shopName,
        merchant_address: orderData.shopAddress,
        merchant_phone: orderData.shopPhone,
        merchant_lat: orderData.shopLat,
        merchant_lng: orderData.shopLng,
        receiver_name: orderData.customerName,
        receiver_phone: orderData.customerPhone,
        receiver_address: orderData.customerAddress,
        receiver_lat: orderData.customerLat,
        receiver_lng: orderData.customerLng,
        goods_info: JSON.stringify(orderData.items || []),
        goods_amount: orderData.goodsAmount || 0,
        delivery_fee: orderData.deliveryFee || 0,
        total_amount: orderData.totalAmount || 0,
        remark: orderData.remark || '',
        callback_url: this.callbackUrl
      };

      const response = await axios.post(
        `${this.baseUrl}/order/receive`,
        requestData,
        { timeout: this.timeout }
      );

      if (response.data.code === 0) {
        return {
          success: true,
          deliveryOrderNo: response.data.data.order_no,
          status: response.data.data.status,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          code: response.data.code,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('创建配送订单失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '网络请求失败'
      };
    }
  }

  /**
   * 查询订单配送状态
   * @param {String} deliveryOrderNo 配送订单号
   * @returns {Promise<Object>} 订单状态
   */
  async getOrderStatus(deliveryOrderNo) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/order/status`,
        {
          params: {
            platform_code: this.platformCode,
            api_secret: this.apiSecret,
            order_no: deliveryOrderNo
          },
          timeout: this.timeout
        }
      );

      if (response.data.code === 0) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('查询订单状态失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '网络请求失败'
      };
    }
  }

  /**
   * 取消配送订单
   * @param {String} deliveryOrderNo 配送订单号
   * @param {String} reason 取消原因
   * @returns {Promise<Object>} 取消结果
   */
  async cancelOrder(deliveryOrderNo, reason = '') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/order/cancel`,
        {
          platform_code: this.platformCode,
          api_secret: this.apiSecret,
          order_no: deliveryOrderNo,
          cancel_reason: reason
        },
        { timeout: this.timeout }
      );

      return {
        success: response.data.code === 0,
        message: response.data.message
      };
    } catch (error) {
      console.error('取消配送订单失败:', error);
      return {
        success: false,
        message: error.response?.data?.message || '网络请求失败'
      };
    }
  }
}

module.exports = new DeliveryService();
```

### 3.2 订单处理服务

创建 `services/orderService.js`：

```javascript
const deliveryService = require('./deliveryService');
const { Order } = require('../models');

/**
 * 订单处理服务
 */
class OrderService {
  /**
   * 创建订单并发送配送
   * @param {Object} orderData 订单数据
   * @returns {Promise<Object>} 创建结果
   */
  async createOrder(orderData) {
    try {
      // 1. 保存订单到数据库
      const order = await Order.create({
        orderNo: this.generateOrderNo(),
        userId: orderData.userId,
        shopId: orderData.shopId,
        shopName: orderData.shopName,
        shopAddress: orderData.shopAddress,
        shopPhone: orderData.shopPhone,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        items: JSON.stringify(orderData.items),
        goodsAmount: orderData.goodsAmount,
        deliveryFee: orderData.deliveryFee,
        totalAmount: orderData.totalAmount,
        status: 'pending', // 待配送
        remark: orderData.remark
      });

      // 2. 如果是配送订单，发送到配送平台
      if (orderData.deliveryType === 'delivery') {
        const deliveryResult = await deliveryService.createOrder({
          orderNo: order.orderNo,
          shopName: order.shopName,
          shopAddress: order.shopAddress,
          shopPhone: order.shopPhone,
          shopLat: orderData.shopLat,
          shopLng: orderData.shopLng,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          customerLat: orderData.customerLat,
          customerLng: orderData.customerLng,
          items: orderData.items,
          goodsAmount: order.goodsAmount,
          deliveryFee: order.deliveryFee,
          totalAmount: order.totalAmount,
          remark: order.remark
        });

        if (deliveryResult.success) {
          // 更新订单配送信息
          await order.update({
            deliveryOrderNo: deliveryResult.deliveryOrderNo,
            deliveryStatus: 'pending',
            status: 'delivery_pending'
          });

          return {
            success: true,
            order: order.toJSON(),
            deliveryOrderNo: deliveryResult.deliveryOrderNo
          };
        } else {
          // 配送下单失败，标记为需人工处理
          await order.update({
            deliveryStatus: 'failed',
            status: 'delivery_failed',
            deliveryError: deliveryResult.message
          });

          return {
            success: false,
            message: `配送下单失败: ${deliveryResult.message}`,
            order: order.toJSON()
          };
        }
      }

      return {
        success: true,
        order: order.toJSON()
      };
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 处理配送回调
   * @param {Object} callbackData 回调数据
   */
  async handleDeliveryCallback(callbackData) {
    try {
      const {
        external_order_no,
        order_no,
        status,
        status_text,
        rider_name,
        rider_phone
      } = callbackData;

      console.log('收到配送回调:', {
        订单号: external_order_no,
        配送订单号: order_no,
        状态: status_text,
        骑手: rider_name
      });

      // 查找订单
      const order = await Order.findOne({
        where: { orderNo: external_order_no }
      });

      if (!order) {
        console.error('订单不存在:', external_order_no);
        return { code: -1, message: '订单不存在' };
      }

      // 更新订单状态
      const statusMap = {
        0: 'delivery_pending',    // 待接单
        1: 'delivery_accepted',   // 已接单
        2: 'delivery_picked_up',  // 已取货
        3: 'delivery_completed',  // 已送达
        4: 'delivery_cancelled'   // 已取消
      };

      const updateData = {
        deliveryStatus: statusMap[status] || 'unknown',
        riderName: rider_name,
        riderPhone: rider_phone
      };

      // 根据状态更新订单状态
      if (status === 3) {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      } else if (status === 4) {
        updateData.status = 'cancelled';
        updateData.cancelledAt = new Date();
      }

      await order.update(updateData);

      // 发送微信订阅消息通知用户
      await this.notifyUser(order.userId, status_text, rider_name);

      return { code: 0, message: 'success' };
    } catch (error) {
      console.error('处理配送回调失败:', error);
      return { code: -1, message: error.message };
    }
  }

  /**
   * 通知用户（微信订阅消息）
   * @param {String} userId 用户ID
   * @param {String} status 状态文本
   * @param {String} riderName 骑手姓名
   */
  async notifyUser(userId, status, riderName) {
    try {
      // 这里调用微信API发送订阅消息
      console.log(`通知用户${userId}: 配送状态${status}, 骑手${riderName}`);
      // TODO: 实现微信订阅消息发送
    } catch (error) {
      console.error('通知用户失败:', error);
    }
  }

  /**
   * 生成订单号
   * @returns {String} 订单号
   */
  generateOrderNo() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `NC${dateStr}${randomStr}`;
  }
}

module.exports = new OrderService();
```

### 3.3 回调接口

创建 `routes/delivery.js`：

```javascript
const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

/**
 * 接收配送平台回调
 * POST /api/delivery/callback
 */
router.post('/callback', async (req, res) => {
  try {
    console.log('收到配送回调:', req.body);
    
    const result = await orderService.handleDeliveryCallback(req.body);
    
    // 必须返回 code: 0，否则配送平台会重试
    res.json(result);
  } catch (error) {
    console.error('处理配送回调失败:', error);
    res.status(500).json({ code: -1, message: error.message });
  }
});

/**
 * 查询订单配送状态
 * GET /api/delivery/status/:orderNo
 */
router.get('/status/:orderNo', async (req, res) => {
  try {
    const { orderNo } = req.params;
    
    const order = await Order.findOne({
      where: { orderNo },
      attributes: ['orderNo', 'deliveryOrderNo', 'deliveryStatus', 'riderName', 'riderPhone']
    });

    if (!order) {
      return res.json({ code: -1, message: '订单不存在' });
    }

    res.json({
      code: 0,
      data: {
        orderNo: order.orderNo,
        deliveryOrderNo: order.deliveryOrderNo,
        status: order.deliveryStatus,
        riderName: order.riderName,
        riderPhone: order.riderPhone
      }
    });
  } catch (error) {
    console.error('查询配送状态失败:', error);
    res.status(500).json({ code: -1, message: error.message });
  }
});

module.exports = router;
```

### 3.4 订单路由

创建 `routes/order.js`：

```javascript
const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

/**
 * 创建订单
 * POST /api/order/create
 */
router.post('/create', async (req, res) => {
  try {
    const orderData = req.body;
    
    // 添加用户ID（从登录信息中获取）
    orderData.userId = req.user.id;
    
    const result = await orderService.createOrder(orderData);
    
    if (result.success) {
      res.json({
        code: 0,
        message: '订单创建成功',
        data: {
          orderNo: result.order.orderNo,
          deliveryOrderNo: result.deliveryOrderNo
        }
      });
    } else {
      res.json({
        code: -1,
        message: result.message,
        data: result.order
      });
    }
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ code: -1, message: error.message });
  }
});

module.exports = router;
```

---

## 四、数据库表结构

### 4.1 订单表扩展字段

```sql
-- 在orders表中添加配送相关字段
ALTER TABLE orders ADD COLUMN delivery_order_no VARCHAR(50) COMMENT '配送平台订单号';
ALTER TABLE orders ADD COLUMN delivery_status VARCHAR(50) COMMENT '配送状态';
ALTER TABLE orders ADD COLUMN delivery_error VARCHAR(255) COMMENT '配送错误信息';
ALTER TABLE orders ADD COLUMN rider_id INT COMMENT '骑手ID';
ALTER TABLE orders ADD COLUMN rider_name VARCHAR(50) COMMENT '骑手姓名';
ALTER TABLE orders ADD COLUMN rider_phone VARCHAR(20) COMMENT '骑手电话';
ALTER TABLE orders ADD COLUMN accepted_at TIMESTAMP COMMENT '接单时间';
ALTER TABLE orders ADD COLUMN picked_up_at TIMESTAMP COMMENT '取货时间';
ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP COMMENT '送达时间';
ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMP COMMENT '取消时间';
```

### 4.2 订单模型定义

```javascript
// models/Order.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '订单号'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  // ... 其他字段
  
  // 配送相关字段
  deliveryOrderNo: {
    type: DataTypes.STRING(50),
    comment: '配送平台订单号'
  },
  deliveryStatus: {
    type: DataTypes.STRING(50),
    comment: '配送状态'
  },
  deliveryError: {
    type: DataTypes.STRING(255),
    comment: '配送错误信息'
  },
  riderId: {
    type: DataTypes.INTEGER,
    comment: '骑手ID'
  },
  riderName: {
    type: DataTypes.STRING(50),
    comment: '骑手姓名'
  },
  riderPhone: {
    type: DataTypes.STRING(20),
    comment: '骑手电话'
  },
  acceptedAt: {
    type: DataTypes.DATE,
    comment: '接单时间'
  },
  pickedUpAt: {
    type: DataTypes.DATE,
    comment: '取货时间'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    comment: '送达时间'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    comment: '取消时间'
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;
```

---

## 五、完整接入流程

```
1. 用户下单
   小程序前端 → 调用 /api/order/create
        ↓
2. 创建订单
   保存到数据库，状态：pending
        ↓
3. 发送配送
   调用配送平台API创建配送订单
        ↓
4. 更新订单
   保存配送订单号，状态：delivery_pending
        ↓
5. 骑手接单
   配送平台推送订单给骑手
        ↓
6. 状态回调
   配送平台 → POST /api/delivery/callback
        ↓
7. 更新状态
   更新订单配送状态，发送微信通知
        ↓
8. 用户查看
   小程序前端实时显示配送进度
```

---

## 六、测试验证

### 6.1 本地测试

1. 启动本地服务器
```bash
npm run dev
```

2. 使用Postman测试创建订单接口

3. 使用ngrok暴露本地服务用于接收回调
```bash
ngrok http 3000
```

### 6.2 线上测试

1. 部署到测试环境
2. 配置测试环境的回调地址
3. 在小程序测试版中下单测试

---

## 七、常见问题

### Q1: 配送下单失败怎么办？

A: 在订单表中记录失败原因，并提供人工处理入口。

### Q2: 回调接收不到怎么办？

A: 检查：
- 服务器是否能被外网访问
- 回调地址配置是否正确
- 是否返回了 `code: 0`

### Q3: 如何确保回调安全？

A: 可以验证回调请求的IP是否在白名单中。

---

## 八、技术支持

如有问题，请联系：
- 配送平台技术支持：xxx@example.com
- 你的技术负责人：xxx
