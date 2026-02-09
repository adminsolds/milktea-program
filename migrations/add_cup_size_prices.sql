-- 添加杯型价格字段到商品表
-- 执行时间: 2025-01-25

ALTER TABLE `products`
ADD COLUMN `price_small` DECIMAL(10, 2) NULL COMMENT '小杯价格' AFTER `enable_sugar`,
ADD COLUMN `price_medium` DECIMAL(10, 2) NULL COMMENT '中杯价格' AFTER `price_small`,
ADD COLUMN `price_large` DECIMAL(10, 2) NULL COMMENT '大杯价格' AFTER `price_medium`;

-- 将现有商品的价格作为中杯价格（默认值）
UPDATE `products` SET `price_medium` = `price` WHERE `price_medium` IS NULL;

-- 设置小杯价格为中杯价格的80%（如果为空）
UPDATE `products` SET `price_small` = `price` * 0.8 WHERE `price_small` IS NULL;

-- 设置大杯价格为中杯价格+2元（如果为空）
UPDATE `products` SET `price_large` = `price` + 2 WHERE `price_large` IS NULL;
