-- 添加杯型启用开关字段到商品表
-- 执行时间: 2025-01-25

ALTER TABLE `products`
ADD COLUMN `enable_size` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用杯型' AFTER `enable_sugar`;
