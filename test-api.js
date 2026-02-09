const http = require('http');

// 测试健康检查接口
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`响应体: ${chunk}`);
  });
  res.on('end', () => {
    console.log('响应结束');
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

req.end();