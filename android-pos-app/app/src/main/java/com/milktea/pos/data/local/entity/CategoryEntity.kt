package com.milktea.pos.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * 分类数据库实体
 */
@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey
    val id: Int,
    val name: String,
    val sortOrder: Int,
    val isActive: Boolean,
    val updatedAt: Long
)
