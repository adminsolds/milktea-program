package com.milktea.pos.domain.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

/**
 * 商品数据模型
 */
@Entity(tableName = "products")
data class Product(
    @PrimaryKey
    val id: Int,
    val name: String,
    @SerializedName("desc")
    val description: String? = null,
    val price: Double,
    @SerializedName("original_price")
    val originalPrice: Double? = null,
    val image: String? = null,
    @SerializedName("category_id")
    val categoryId: Int,
    @SerializedName("is_active")
    val isActive: Boolean = true,
    @SerializedName("sort_order")
    val sortOrder: Int = 0,
    val specs: List<String>? = null,
    val sugars: List<String>? = null,
    val sizes: List<Size>? = null,
    val toppings: List<Topping>? = null,
    @SerializedName("created_at")
    val createdAt: String? = null,
    @SerializedName("updated_at")
    val updatedAt: String? = null,
    val category: CategoryInfo? = null
) {
    // 从嵌套的 category 对象中获取分类名称
    val categoryName: String?
        get() = category?.name

    // 转换为时间戳（用于 Room 数据库）
    val updatedAtTimestamp: Long
        get() = updatedAt?.let { parseIsoDateTime(it) } ?: System.currentTimeMillis()

    val createdAtTimestamp: Long
        get() = createdAt?.let { parseIsoDateTime(it) } ?: System.currentTimeMillis()

    private fun parseIsoDateTime(isoString: String): Long {
        return try {
            val formatter = java.time.format.DateTimeFormatter.ISO_DATE_TIME
            val dateTime = java.time.LocalDateTime.parse(isoString, formatter)
            dateTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
    }
}

/**
 * 分类信息（嵌套在商品中）
 */
data class CategoryInfo(
    val id: Int,
    val name: String
)

/**
 * 商品尺寸
 */
data class Size(
    val name: String,
    val price: Double
)

/**
 * 配料
 */
data class Topping(
    val name: String,
    val price: Double
)

/**
 * 商品分类
 */
@Entity(tableName = "categories")
data class Category(
    @PrimaryKey
    val id: Int,
    val name: String,
    val icon: String? = null,
    @SerializedName("sort_order")
    val sortOrder: Int = 0,
    @SerializedName("is_active")
    val isActive: Boolean = true
)
