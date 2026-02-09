package com.milktea.pos.utils

import java.text.SimpleDateFormat
import java.util.*

/**
 * 日期工具类
 */
object DateUtils {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.CHINA)
    private val timeFormat = SimpleDateFormat("HH:mm", Locale.CHINA)
    private val dateTimeFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.CHINA)
    private val orderNoFormat = SimpleDateFormat("yyyyMMddHHmmss", Locale.CHINA)

    /**
     * 格式化日期
     */
    fun formatDate(timestamp: Long): String {
        return dateFormat.format(Date(timestamp))
    }

    /**
     * 格式化时间
     */
    fun formatTime(timestamp: Long): String {
        return timeFormat.format(Date(timestamp))
    }

    /**
     * 格式化日期时间
     */
    fun formatDateTime(timestamp: Long): String {
        return dateTimeFormat.format(Date(timestamp))
    }

    /**
     * 生成订单号
     */
    fun generateOrderNo(): String {
        return orderNoFormat.format(Date()) + (1000..9999).random()
    }

    /**
     * 获取今天开始时间戳
     */
    fun getTodayStart(): Long {
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }

    /**
     * 获取今天结束时间戳
     */
    fun getTodayEnd(): Long {
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 23)
        calendar.set(Calendar.MINUTE, 59)
        calendar.set(Calendar.SECOND, 59)
        calendar.set(Calendar.MILLISECOND, 999)
        return calendar.timeInMillis
    }
}
