const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

// 配置中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 简单路由
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '服务器运行正常！',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`登录页面: http://localhost:${port}`);
  console.log(`健康检查: http://localhost:${port}/api/health`);
});