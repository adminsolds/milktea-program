const jwt = require('jsonwebtoken');

// 验证管理员身份
const authenticateAdmin = (req, res, next) => {
  try {
    // 首先尝试从 Authorization header 获取 JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // 验证 JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      // 检查是否是管理员角色
      if (decoded.role === 'admin') {
        req.admin = {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role
        };
        return next();
      } else {
        return res.status(403).json({
          error: 'Forbidden',
          message: '权限不足，需要管理员权限'
        });
      }
    }

    // 如果没有 token，尝试从 session 中获取管理员信息（向后兼容）
    if (req.session && req.session.adminId) {
      req.admin = {
        id: req.session.adminId,
        username: req.session.adminUsername || 'admin'
      };
      return next();
    }

    // 如果没有 session，检查是否是开发环境
    if (process.env.NODE_ENV === 'development') {
      req.admin = {
        id: 1,
        username: 'admin'
      };
      return next();
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: '请先登录管理员账号'
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '无效的认证令牌'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '认证令牌已过期'
      });
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: '认证失败'
    });
  }
};

// 验证用户身份（可选）
const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '请先登录',
        needLogin: true
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('User auth error:', error);
    
    // 根据错误类型返回不同的错误信息
    let message = '认证失败';
    if (error.name === 'JsonWebTokenError') {
      message = '无效的认证令牌';
    } else if (error.name === 'TokenExpiredError') {
      message = '认证令牌已过期';
    }
    
    return res.status(401).json({
      error: 'Unauthorized',
      message: message,
      needLogin: true,
      errorType: error.name
    });
  }
};

module.exports = {
  authenticateAdmin,
  authenticateUser,
  authenticate: authenticateUser // authenticate 作为 authenticateUser 的别名
};
