const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机数 + 文件扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 过滤图片文件
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'));
  }
};

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  },
  fileFilter: fileFilter
});

// 上传单张图片
const uploadImage = (req, res) => {
  // 使用multer中间件处理文件上传
  const uploadSingle = upload.single('image');
  
  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // 返回图片URL，使用完整URL路径
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `/uploads/${req.file.filename}`;
    const fullUrl = baseUrl + imageUrl;
    res.json({
      url: fullUrl, // 返回完整URL给前端
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: fullUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      }
    });
  });
};

// 上传多张图片
const uploadImages = (req, res) => {
  // 使用multer中间件处理文件上传
  const uploadMultiple = upload.array('images', 10); // 最多上传10张
  
  uploadMultiple(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // 返回图片URL数组
    const images = req.files.map(file => ({
      imageUrl: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));
    
    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        count: images.length,
        images: images
      }
    });
  });
};

module.exports = {
  uploadImage,
  uploadImages
};