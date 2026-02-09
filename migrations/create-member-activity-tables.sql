-- 创建会员活动表
CREATE TABLE IF NOT EXISTS `member_activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '活动名称',
  `type` enum('lottery','member_day','birthday','new_product','flash_sale','custom') NOT NULL COMMENT '活动类型',
  `description` text DEFAULT NULL COMMENT '活动描述',
  `start_time` datetime NOT NULL COMMENT '活动开始时间',
  `end_time` datetime NOT NULL COMMENT '活动结束时间',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `config` json DEFAULT NULL COMMENT '活动配置（JSON格式）',
  `min_level` varchar(50) DEFAULT NULL COMMENT '最低会员等级要求',
  `is_repeatable` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否可重复参与：0-否，1-是',
  `daily_limit` int(11) DEFAULT 1 COMMENT '每日参与次数限制',
  `total_limit` int(11) DEFAULT NULL COMMENT '总参与次数限制',
  `sort_order` int(11) NOT NULL DEFAULT 0 COMMENT '排序权重',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员活动表';

-- 创建会员活动参与记录表
CREATE TABLE IF NOT EXISTS `member_activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `activity_id` int(11) NOT NULL COMMENT '活动ID',
  `activity_type` varchar(50) NOT NULL COMMENT '活动类型',
  `action` varchar(100) NOT NULL COMMENT '操作类型：lottery-抽奖, receive-领取福利, purchase-购买等',
  `result` json DEFAULT NULL COMMENT '操作结果（JSON格式）',
  `reward_type` enum('points','coupon','product','discount','none') DEFAULT NULL COMMENT '奖励类型',
  `reward_value` json DEFAULT NULL COMMENT '奖励内容（JSON格式）',
  `ip_address` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text DEFAULT NULL COMMENT '用户代理信息',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_activity_id` (`activity_id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员活动参与记录表';
