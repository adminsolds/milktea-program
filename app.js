const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const https = require('https');
const http = require('http');

console.log('正在加载环境变量...');
dotenv.config();

// 捕获全局错误
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

try {
  console.log('正在初始化Express应用...');
  const app = express();
  const port = process.env.PORT || 3003;

  // 配置模板引擎
  console.log('正在配置模板引擎...');
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // 配置中间件
    console.log('正在配置中间件...');
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));

    // 注释掉 PNG 到 SVG 的重定向规则，允许直接访问 PNG 图片
    // app.use((req, res, next) => {
    //   if (req.path.startsWith('/images/') && req.path.endsWith('.png')) {
    //     const svgPath = req.path.replace(/\.png$/, '.svg');
    //     res.redirect(302, svgPath);
    //     return;
    //   }
    //   next();
    // });

    // 静态文件服务 - 添加PNG到SVG的备用支持
    const fs = require('fs');
    const staticServe = express.static(path.join(__dirname, 'public'));
    app.use((req, res, next) => {
      // 检查是否是分类图标的PNG请求
      if (req.path.startsWith('/images/categories/') && req.path.endsWith('.png')) {
        const pngPath = path.join(__dirname, 'public', req.path);
        const svgPath = pngPath.replace('.png', '.svg');

        // 检查PNG文件是否存在
        if (!fs.existsSync(pngPath) && fs.existsSync(svgPath)) {
          // PNG不存在但SVG存在，返回SVG文件
          return res.sendFile(svgPath);
        }
      }
      staticServe(req, res, next);
    });
    
    // 无效后台路由重定向到首页
    app.use('/admin/:id', (req, res, next) => {
      const id = req.params.id;
      // 处理数字ID和undefined等无效路径
      if (/^\d+$/.test(id) || id === 'undefined' || id === 'null') {
        res.redirect('/admin/dashboard');
        return;
      }
      next();
    });
    
    // 注意：这个中间件放在admin路由之前会导致问题，已删除

  // 测试数据库连接
  console.log('正在导入数据库配置...');
  const { sequelize, testConnection } = require('./config/db');
  
  console.log('正在测试数据库连接...');
  testConnection();

  // 同步数据库模型
  console.log('正在导入数据库模型...');
  const models = require('./models');
  const { initDefaultAdmin } = require('./controllers/adminController');
  const { initDefaultMemberLevels } = require('./controllers/memberLevelController');
  const { initDefaultSystemConfigs } = require('./controllers/systemConfigController');

  console.log('正在同步数据库模型...');
  sequelize.sync({ force: false, alter: false })
    .then(() => {
      console.log('数据库模型同步成功！');
      // 初始化默认管理员账号
      initDefaultAdmin();

      // 初始化默认会员等级
      initDefaultMemberLevels();

      // 初始化默认系统配置
      initDefaultSystemConfigs();

      // 初始化测试数据
      const initTestData = require('./utils/initData');
      initTestData();

      // 迁移储值记录到余额记录（仅首次运行）
      const migrateBalanceRecords = require('./utils/migrateBalanceRecords');
      migrateBalanceRecords().catch(err => {
        console.error('余额记录迁移失败:', err.message);
      });
    })
    .catch(err => {
      console.error('数据库模型同步失败:', err.message);
      // 继续启动服务器，即使模型同步失败
      console.log('继续启动服务器...');
    });

  // 导入API路由
  console.log('正在导入API路由...');
  const apiRoutes = require('./routes');

  // 定义路由
  app.get('/', (req, res) => {
    res.render('login');
  });

  // 处理favicon.ico请求，避免404错误
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });
  
  // 后台管理页面路由
  app.get('/admin/dashboard', (req, res) => {
    res.render('dashboard');
  });
  
  // 商品管理页面
  app.get('/admin/products', (req, res) => {
    res.render('products');
  });

  // 商品推荐页面
  app.get('/admin/recommendations', (req, res) => {
    res.render('recommendations');
  });

  // 订单管理页面
  app.get('/admin/orders', (req, res) => {
    res.render('orders');
  });

  // 统一订单管理页面
  app.get('/admin/all-orders', (req, res) => {
    res.render('all-orders');
  });

  // 用户管理页面
  app.get('/admin/users', (req, res) => {
    res.render('users');
  });
  
  // 会员管理页面
  app.get('/admin/members', (req, res) => {
    res.render('members');
  });
  
  // 会员等级管理页面
  app.get('/admin/member-levels', (req, res) => {
    res.render('member-levels');
  });

  // 系统配置页面
  app.get('/admin/system-config', (req, res) => {
    res.render('system-config');
  });

  // 优惠券管理页面
  app.get('/admin/coupons', (req, res) => {
    res.render('coupons');
  });

  // 现场点单页面
  app.get('/admin/pos', (req, res) => {
    res.render('pos');
  });

  // 店铺管理页面
  app.get('/admin/stores', (req, res) => {
    res.render('stores');
  });
  
  // UI管理页面
  app.get('/admin/ui', (req, res) => {
    res.render('ui');
  });
  
  // 数据统计页面
  app.get('/admin/stats', (req, res) => {
    res.render('dashboard');
  });
  
  // 储值管理页面
  app.get('/admin/recharge', (req, res) => {
    res.render('recharge');
  });

  // 团购管理页面
  app.get('/admin/group-buy', (req, res) => {
    res.render('groupBuy');
  });

  // 外卖平台管理页面
  app.get('/admin/delivery-platforms', (req, res) => {
    res.render('delivery-platforms');
  });

  // 会员活动管理页面
  app.get('/admin/member-activities', (req, res) => {
    res.render('member-activities');
  });

  // 退出登录
  app.get('/admin/logout', (req, res) => {
    res.redirect('/');
  });

  // 注册API路由
  app.use('/api', apiRoutes);
  console.log('API路由注册成功！');

  // 注册打印路由
  const printRoutes = require('./routes/print');
  app.use('/api/print', printRoutes);
  console.log('打印路由注册成功！');

  // 加载 HTTPS 配置
  const { httpsConfig, validateHttpsConfig } = require('./config/https');
  const validation = validateHttpsConfig();

  // 监听端口
  console.log('正在启动服务器...');

  // 总是启动 HTTP 服务器（用于本地开发）
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`\n✓ HTTP 服务器启动成功！`);
    console.log(`  本地访问: http://localhost:${port}`);
    console.log(`  局域网访问: http://192.168.3.61:${port}`);
    console.log(`  API地址: http://192.168.3.61:${port}/api`);
  });
  
  // 设置 Keep-Alive 超时，避免 Android 客户端出现 "unexpected end of stream" 错误
  server.keepAliveTimeout = 120000; // 120秒
  server.headersTimeout = 120000; // 120秒

  // 如果有有效的 HTTPS 配置，同时启动 HTTPS 服务器
  if (validation.valid) {
    const httpsOptions = {
      key: fs.readFileSync(httpsConfig.key),
      cert: fs.readFileSync(httpsConfig.cert)
    };

    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(httpsConfig.port, '0.0.0.0', () => {
      console.log(`\n✓ HTTPS 服务器启动成功！`);
      console.log(`  本地访问: https://localhost:${httpsConfig.port}`);
      console.log(`  局域网访问: https://192.168.3.61:${httpsConfig.port}`);
      console.log(`  API地址: https://192.168.3.61:${httpsConfig.port}/api`);
      console.log(`  健康检查: https://192.168.3.61:${httpsConfig.port}/api/health`);
      console.log(`\n注意: 使用自签名证书，浏览器会提示"不安全"，请点击"继续访问"`);
    });
  } else {
    console.log(`\nHTTPS 配置无效: ${validation.message}`);
    console.log('仅运行 HTTP 服务器\n');
  }
} catch (error) {
  console.error('应用启动失败:', error);
  process.exit(1);
}