-- 创建数据库
CREATE DATABASE IF NOT EXISTS milktea_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER IF NOT EXISTS 'milktea'@'localhost' IDENTIFIED BY 'MilkTea@2024';

-- 授权
GRANT ALL PRIVILEGES ON milktea_shop.* TO 'milktea'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;

-- 查看用户
SELECT user, host FROM mysql.user;
