-- 添加每个杯型的独立启用开关字段
-- 执行时间: 2025-01-25

ALTER TABLE `products`
ADD COLUMN `enable_size_small` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用小杯' AFTER `enable_size`,
ADD COLUMN `enable_size_medium` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用中杯' AFTER `enable_size_small`,
ADD COLUMN `enable_size_large` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用大杯' AFTER `enable_size_medium`;
