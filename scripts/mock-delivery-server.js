/**
 * 模拟外卖平台接收服务器
 * 用于测试奶茶店向外卖平台发送订单的完整流程
 * 
 * 用法: node scripts/mock-delivery-server.js [端口]
 * 默认端口: 3456
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');

const PORT = process.argv[2] || 3456;

// 模拟数据库存储
const receivedOrders = new Map();

// 验证签名
function verifySignature(params, secret) {
  const sign = params.sign;
  delete params.sign;

  // 按key排序
  const sortedKeys = Object.keys(params).sort();
  const signString = sortedKeys
    .filter(key => typeof params[key] !== 'object' && !Array.isArray(params[key]))
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const computedSign = crypto
    .createHmac('sha256', secret)
    .update(signString)
    .digest('hex');

  return computedSign === sign;
}

// 生成响应
function createResponse(code, message, data = null) {
  const response = { code, message };
  if (data) response.data = data;
  return JSON.stringify(response);
}

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// 处理接收订单
async function handleReceiveOrder(req, res, body) {
  console.log('\n📦 收到新订单请求:');
  console.log('  平台代码:', body.platform_code);
  console.log('  外部订单号:', body.external_order_no);
  console.log('  商户名称:', body.merchant_name);
  console.log('  收货人:', body.receiver_name);
  console.log('  收货地址:', body.receiver_address);
  console.log('  商品信息:', body.goods_info);
  console.log('  订单金额:', body.total_amount);
  console.log('  签名:', body.sign);

  // 生成配送订单号
  const deliveryOrderNo = `DL${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // 存储订单
  receivedOrders.set(deliveryOrderNo, {
    ...body,
    deliveryOrderNo,
    status: 'pending',
    statusText: '待接单',
    createTime: new Date().toISOString()
  });

  console.log('  ✅ 订单已接收，配送订单号:', deliveryOrderNo);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(createResponse(0, 'success', {
    order_no: deliveryOrderNo,
    status: 'pending',
    status_text: '待接单'
  }));
}

// 处理查询订单状态
async function handleQueryStatus(req, res, query) {
  const orderNo = query.order_no;
  console.log('\n🔍 查询订单状态:', orderNo);

  const order = receivedOrders.get(orderNo);
  if (!order) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(createResponse(404, '订单不存在'));
    return;
  }

  console.log('  订单状态:', order.status, '-', order.statusText);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(createResponse(0, 'success', {
    order_no: orderNo,
    status: order.status,
    status_text: order.statusText,
    rider_name: '张骑手',
    rider_phone: '13900139000',
    rider_lat: 39.915,
    rider_lng: 116.405
  }));
}

// 处理取消订单
async function handleCancelOrder(req, res, body) {
  const orderNo = body.order_no;
  console.log('\n❌ 取消订单:', orderNo);
  console.log('  取消原因:', body.cancel_reason || '无');

  const order = receivedOrders.get(orderNo);
  if (!order) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(createResponse(404, '订单不存在'));
    return;
  }

  order.status = 'cancelled';
  order.statusText = '已取消';
  order.cancelReason = body.cancel_reason;
  order.cancelTime = new Date().toISOString();

  console.log('  ✅ 订单已取消');

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(createResponse(0, 'success'));
}

// 创建服务器
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`\n[${new Date().toISOString()}] ${method} ${path}`);

  try {
    if (path === '/order/receive' && method === 'POST') {
      const body = await parseBody(req);
      await handleReceiveOrder(req, res, body);
    } else if (path === '/order/status' && method === 'GET') {
      await handleQueryStatus(req, res, parsedUrl.query);
    } else if (path === '/order/cancel' && method === 'POST') {
      const body = await parseBody(req);
      await handleCancelOrder(req, res, body);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(createResponse(404, '接口不存在'));
    }
  } catch (error) {
    console.error('处理请求出错:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(createResponse(500, '服务器内部错误'));
  }
});

server.listen(PORT, () => {
  console.log('========================================');
  console.log('   🚀 模拟外卖平台服务器已启动');
  console.log('========================================');
  console.log(`   监听端口: ${PORT}`);
  console.log(`   API地址: http://localhost:${PORT}`);
  console.log('');
  console.log('可用接口:');
  console.log(`  POST http://localhost:${PORT}/order/receive  - 接收订单`);
  console.log(`  GET  http://localhost:${PORT}/order/status   - 查询订单状态`);
  console.log(`  POST http://localhost:${PORT}/order/cancel   - 取消订单`);
  console.log('');
  console.log('按 Ctrl+C 停止服务器');
  console.log('========================================\n');
});

// 处理退出
process.on('SIGINT', () => {
  console.log('\n\n服务器已停止');
  process.exit(0);
});
