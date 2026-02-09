package com.milktea.pos.data.local

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.milktea.pos.domain.model.OrderItem

/**
 * Room 数据库类型转换器
 */
class Converters {

    private val gson = Gson()

    // OrderItem 列表转换
    @TypeConverter
    fun fromOrderItemList(items: List<OrderItem>): String {
        return gson.toJson(items)
    }

    @TypeConverter
    fun toOrderItemList(json: String): List<OrderItem> {
        val type = object : TypeToken<List<OrderItem>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }
}
