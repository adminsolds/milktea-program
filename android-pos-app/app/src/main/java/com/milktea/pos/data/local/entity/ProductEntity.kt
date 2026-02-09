package com.milktea.pos.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * 商品数据库实体
 */
@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey
    val id: Int,
    val name: String,
    val description: String?,
    val price: Double,
    val categoryId: Int,
    val categoryName: String?,
    val image: String?,
    val isActive: Boolean,
    val isNew: Boolean,
    val isRecommended: Boolean,
    val stock: Int?,
    val updatedAt: Long
)
