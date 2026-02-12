const { Sequelize } = require('sequelize');
const path = require('path');

// 使用 SQLite 数据库（无需安装MySQL）
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// 创建Sequelize实例
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // 禁用日志
  define: {
    underscored: true, // 使用下划线命名法
    timestamps: true, // 自动添加created_at和updated_at字段
    paranoid: true, // 软删除
  },
  dialectOptions: {
    mode: 'OPEN_READWRITE | OPEN_CREATE'
  },
  pool: {
    max: 1,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite 数据库连接成功！');
    console.log('数据库文件位置:', dbPath);
  } catch (error) {
    console.error('数据库连接失败:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection
};
