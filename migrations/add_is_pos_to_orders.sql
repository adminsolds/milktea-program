-- 添加 is_pos 字段到 orders 表
ALTER TABLE `orders` ADD COLUMN `is_pos` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为POS现场点单订单' AFTER `pickup_minutes`;
