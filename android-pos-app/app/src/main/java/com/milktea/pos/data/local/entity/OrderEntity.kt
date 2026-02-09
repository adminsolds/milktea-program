package com.milktea.pos.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * 订单数据库实体
 */
@Entity(tableName = "orders")
data class OrderEntity(
    @PrimaryKey
    val id: Int,
    val orderNo: String,
    val orderType: String,
    val status: String,
    val paymentMethod: String,
    val paymentStatus: String,
    val productTotal: Double,
    val memberDiscount: Double,
    val couponDiscount: Double,
    val finalPrice: Double,
    val memberId: Int?,
    val memberPhone: String?,
    val memberName: String?,
    val remark: String?,
    val createdAt: Long,
    val updatedAt: Long,
    val isSynced: Boolean = false
)
