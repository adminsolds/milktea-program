-- 创建订阅设置表
CREATE TABLE IF NOT EXISTS `subscription_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `order_pickup` tinyint(1) DEFAULT 1 COMMENT '取餐通知',
  `order_status` tinyint(1) DEFAULT 1 COMMENT '订单状态通知',
  `order_promotion` tinyint(1) DEFAULT 0 COMMENT '优惠活动通知',
  `order_review` tinyint(1) DEFAULT 0 COMMENT '评价通知',
  `member_balance` tinyint(1) DEFAULT 1 COMMENT '储值余额提醒',
  `member_coupon_received` tinyint(1) DEFAULT 1 COMMENT '优惠券到账通知',
  `member_coupon_expiring` tinyint(1) DEFAULT 1 COMMENT '优惠券到期通知',
  `member_points_change` tinyint(1) DEFAULT 1 COMMENT '积分变动通知',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订阅设置表';
