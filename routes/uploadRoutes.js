const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { User } = require('../models');
const fs = require('fs');

// 获取服务器基础URL的辅助函数
function getBaseUrl(req) {
  const protocol = req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  return `${protocol}://${host}`;
}

// 确保上传目录存在
const avatarsDir = path.join(__dirname, '../uploads/avatars');
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据上传类型选择不同的目录
    if (req.path.includes('/avatar')) {
      cb(null, avatarsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  }
});

// 头像上传路由
router.post('/avatar', authenticate, (req, res) => {
  console.log('=== 收到头像上传请求 ===');
  console.log('用户ID:', req.user?.id);

  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      console.error('Multer上传错误:', err);
      return res.status(400).json({ success: false, message: `上传失败: ${err.message}` });
    }

    try {
      if (!req.file) {
        console.error('未收到上传文件');
        return res.status(400).json({ success: false, message: '未上传文件' });
      }

      console.log('上传文件信息:', req.file);

      // 获取用户信息
      const userId = req.user?.id;
      if (!userId) {
        console.error('用户ID不存在');
        return res.status(401).json({ success: false, message: '用户未登录' });
      }

      // 查找用户
      const user = await User.findByPk(userId);
      if (!user) {
        console.error('用户不存在');
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      // 生成完整的访问URL - 使用动态服务器地址
      const baseUrl = getBaseUrl(req);
      const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
      console.log('生成头像URL:', avatarUrl);

      // 更新用户头像
      await user.update({ avatar: avatarUrl });
      console.log('用户头像更新成功:', user.id);

      console.log('头像上传成功:', {
        userId: user.id,
        avatarUrl: avatarUrl
      });

      res.json({
        success: true,
        message: '头像上传成功',
        avatarUrl: avatarUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('上传头像失败:', error);
      console.error('错误堆栈:', error.stack);
      res.status(500).json({ success: false, message: `上传失败: ${error.message}` });
    }
  });
});

// 通用图片上传路由 - 用于UI管理中的图片上传（如底部导航图标、轮播图等）
router.post('/image', (req, res) => {
  console.log('=== 收到通用图片上传请求 ===');
  console.log('请求头:', req.headers);

  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer上传错误:', err);
      return res.status(400).json({ success: false, message: `上传失败: ${err.message}` });
    }

    try {
      if (!req.file) {
        console.error('未收到上传文件');
        return res.status(400).json({ success: false, message: '未上传文件' });
      }

      console.log('上传文件信息:', req.file);

      // 生成完整的访问URL
      const baseUrl = getBaseUrl(req);
      let imageUrl;

      // 根据存储目录生成不同的URL
      if (req.file.destination.includes('avatars')) {
        imageUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
      } else {
        imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      }

      console.log('生成图片URL:', imageUrl);

      res.json({
        success: true,
        message: '图片上传成功',
        url: imageUrl,
        filename: req.file.filename,
        path: req.file.path
      });
    } catch (error) {
      console.error('上传图片失败:', error);
      console.error('错误堆栈:', error.stack);
      res.status(500).json({ success: false, message: `上传失败: ${error.message}` });
    }
  });
});

module.exports = router;
