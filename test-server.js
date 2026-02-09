const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

// 配置中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 简单路由
app.get('/', (req, res) => {
  res.send('测试服务器已启动！');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '测试服务器运行正常！',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`测试服务器运行在 http://localhost:${port}`);
  console.log(`健康检查: http://localhost:${port}/api/health`);
});