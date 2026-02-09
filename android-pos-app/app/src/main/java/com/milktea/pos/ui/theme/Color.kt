package com.milktea.pos.ui.theme

import androidx.compose.ui.graphics.Color

// ============================================
// 现代奶茶主题色彩系统 - Material Design 3
// ============================================

// 主色调 - 温暖的珊瑚/奶茶粉
val PrimaryColor = Color(0xFFE07A5F)        // 珊瑚粉 - 主按钮、强调色
val PrimaryLight = Color(0xFFF2C6B8)        // 浅珊瑚 - 悬停、背景
val PrimaryDark = Color(0xFFC45A3D)         // 深珊瑚 - 按下状态
val PrimaryContainer = Color(0xFFFFF0ED)    // 极浅珊瑚 - 容器背景

// 次要色 - 清新的薄荷绿
val SecondaryColor = Color(0xFF81B29A)      // 薄荷绿 - 次要按钮
val SecondaryLight = Color(0xFFB8D4C8)      // 浅薄荷 - 背景
val SecondaryDark = Color(0xFF5A8A72)       // 深薄荷 - 按下状态
val SecondaryContainer = Color(0xFFE8F5EE)  // 极浅薄荷 - 容器背景

// 第三色 - 温暖的奶油黄
val TertiaryColor = Color(0xFFF2CC8F)       // 奶油黄
val TertiaryLight = Color(0xFFFDF2E0)       // 浅奶油
val TertiaryDark = Color(0xFFD4A85C)        // 深奶油

// ============================================
// 背景色系统
// ============================================
val BackgroundLight = Color(0xFFF8F6F4)     // 温暖的米白背景
val BackgroundDark = Color(0xFF1C1C1E)      // 深色背景
val SurfaceLight = Color(0xFFFFFFFF)        // 纯白表面
val SurfaceDark = Color(0xFF2C2C2E)         // 深灰表面
val SurfaceVariantLight = Color(0xFFF0EDE9) // 变体表面
val SurfaceVariantDark = Color(0xFF3A3A3C)  // 深色变体

// 液态玻璃表面色（兼容旧代码）
val GlassSurfaceLight = Color(0xFFFFFF).copy(alpha = 0.60f)
val GlassSurfaceDark = Color(0x2C2C2E).copy(alpha = 0.60f)

// 液态玻璃背景色（兼容旧代码）
val GlassBackgroundLight = Color(0xF5F5F7)  // iOS 系统灰白背景
val GlassBackgroundDark = Color(0x000000)    // 纯黑背景

// ============================================
// 文字颜色
// ============================================
val TextPrimaryLight = Color(0xFF2D2D2D)    // 主要文字 - 近黑
val TextSecondaryLight = Color(0xFF6B6B6B)  // 次要文字 - 深灰
val TextHintLight = Color(0xFF9E9E9E)       // 提示文字 - 中灰
val TextPrimaryDark = Color(0xFFFFFFFF)     // 深色主题主要文字
val TextSecondaryDark = Color(0xFFEBEBF5).copy(alpha = 0.6f)  // 深色主题次要文字

// 液态玻璃文字色（兼容旧代码）
val GlassTextPrimaryLight = Color(0xFF2D2D2D)
val GlassTextSecondaryLight = Color(0xFF6B6B6B)
val GlassTextPrimaryDark = Color(0xFFFFFFFF)
val GlassTextSecondaryDark = Color(0xFFEBEBF5).copy(alpha = 0.6f)

// ============================================
// 液态玻璃效果颜色（保留但优化）
// ============================================
val GlassLight = Color(0xFFFFFFFF).copy(alpha = 0.85f)
val GlassLightHover = Color(0xFFFFFFFF).copy(alpha = 0.95f)
val GlassDark = Color(0x1C1C1E).copy(alpha = 0.85f)
val GlassDarkHover = Color(0x1C1C1E).copy(alpha = 0.95f)
val GlassBorderLight = Color(0xFFE8E4E0)
val GlassBorderDark = Color(0xFFFFFF).copy(alpha = 0.1f)

// ============================================
// 系统色（现代风格）
// ============================================
val SuccessColor = Color(0xFF4CAF50)        // 成功绿
val SuccessLight = Color(0xFFE8F5E9)        // 浅成功色
val WarningColor = Color(0xFFFFA726)        // 警告橙
val WarningLight = Color(0xFFFFF3E0)        // 浅警告色
val ErrorColor = Color(0xFFEF5350)          // 错误红
val ErrorLight = Color(0xFFFFEBEE)          // 浅错误色
val InfoColor = Color(0xFF42A5F5)           // 信息蓝
val InfoLight = Color(0xFFE3F2FD)           // 浅信息色

// ============================================
// 价格与商业颜色
// ============================================
val PriceColor = Color(0xFFE07A5F)          // 价格颜色 - 珊瑚粉
val PriceOriginal = Color(0xFF9E9E9E)       // 原价颜色 - 灰色
val DiscountColor = Color(0xFF81B29A)       // 优惠颜色 - 薄荷绿

// ============================================
// 订单状态色
// ============================================
val StatusPending = Color(0xFFFFA726)       // 待处理 - 橙色
val StatusPreparing = Color(0xFF42A5F5)     // 制作中 - 蓝色（兼容旧代码）
val StatusProcessing = Color(0xFF42A5F5)    // 处理中 - 蓝色
val StatusCompleted = Color(0xFF4CAF50)     // 已完成 - 绿色
val StatusCancelled = Color(0xFF9E9E9E)     // 已取消 - 灰色

// ============================================
// 渐变色
// ============================================
val GradientStart = Color(0xFFE07A5F)
val GradientEnd = Color(0xFFF2C6B8)
val GradientSecondaryStart = Color(0xFF81B29A)
val GradientSecondaryEnd = Color(0xFFB8D4C8)

// ============================================
// 阴影颜色
// ============================================
val ShadowLight = Color(0x000000).copy(alpha = 0.06f)
val ShadowMedium = Color(0x000000).copy(alpha = 0.12f)
val ShadowDark = Color(0x000000).copy(alpha = 0.24f)

// ============================================
// 分割线颜色
// ============================================
val DividerLight = Color(0xFFE8E4E0)
val DividerDark = Color(0xFFFFFF).copy(alpha = 0.12f)

// ============================================
// 灰度色阶（兼容旧代码）
// ============================================
val Gray1 = Color(0xFF8E8E93)   // 次要文字
val Gray2 = Color(0xFFAEAEB2)   // 占位符
val Gray3 = Color(0xFFC7C7CC)   // 分割线
val Gray4 = Color(0xFFD1D1D6)   // 边框
val Gray5 = Color(0xFFE5E5EA)   // 背景
val Gray6 = Color(0xFFF2F2F7)   // 系统背景

// ============================================
// iOS 风格系统色（兼容旧代码）
// ============================================
val iOSBlue = Color(0xFF007AFF)
val iOSGreen = Color(0xFF34C759)
val iOSOrange = Color(0xFFFF9500)
val iOSRed = Color(0xFFFF3B30)
val iOSYellow = Color(0xFFFFCC00)
val iOSPurple = Color(0xFFAF52DE)
val iOSPink = Color(0xFFFF2D55)
val iOSTeal = Color(0xFF5AC8FA)
val iOSIndigo = Color(0xFF5856D6)
