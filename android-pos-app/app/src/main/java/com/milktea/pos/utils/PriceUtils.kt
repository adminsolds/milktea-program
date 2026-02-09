package com.milktea.pos.utils

import java.math.BigDecimal
import java.math.RoundingMode

/**
 * 价格计算工具类
 */
object PriceUtils {

    /**
     * 格式化价格（保留2位小数）
     */
    fun format(price: Double): String {
        return String.format("%.2f", price)
    }

    /**
     * 加法（精确计算）
     */
    fun add(a: Double, b: Double): Double {
        return BigDecimal(a.toString())
            .add(BigDecimal(b.toString()))
            .setScale(2, RoundingMode.HALF_UP)
            .toDouble()
    }

    /**
     * 减法（精确计算）
     */
    fun subtract(a: Double, b: Double): Double {
        return BigDecimal(a.toString())
            .subtract(BigDecimal(b.toString()))
            .setScale(2, RoundingMode.HALF_UP)
            .toDouble()
    }

    /**
     * 乘法（精确计算）
     */
    fun multiply(a: Double, b: Double): Double {
        return BigDecimal(a.toString())
            .multiply(BigDecimal(b.toString()))
            .setScale(2, RoundingMode.HALF_UP)
            .toDouble()
    }

    /**
     * 除法（精确计算）
     */
    fun divide(a: Double, b: Double): Double {
        return BigDecimal(a.toString())
            .divide(BigDecimal(b.toString()), 2, RoundingMode.HALF_UP)
            .toDouble()
    }

    /**
     * 计算折扣后价格
     */
    fun applyDiscount(price: Double, discount: Double): Double {
        return multiply(price, discount)
    }

    /**
     * 计算会员折扣金额
     */
    fun calculateDiscount(price: Double, discount: Double): Double {
        return subtract(price, applyDiscount(price, discount))
    }
}
