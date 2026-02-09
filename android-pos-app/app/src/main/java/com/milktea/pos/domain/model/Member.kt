package com.milktea.pos.domain.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

/**
 * 会员数据模型
 */
@Entity(tableName = "members")
data class Member(
    @PrimaryKey
    val id: Int = 0,
    @SerializedName("phone") val phone: String = "",
    @SerializedName("nickname") val name: String? = null,
    @SerializedName("avatarUrl") val avatar: String? = null,
    
    // 账户信息
    val balance: Double = 0.0,
    val points: Int = 0,
    
    // 会员等级
    val levelId: Int? = null,
    val levelName: String? = null,
    val discount: Double = 1.0,     // 折扣率，1.0表示无折扣
    
    // 统计信息
    val totalConsumption: Double = 0.0,
    val orderCount: Int = 0,
    
    // 时间戳（后端返回ISO日期字符串）
    val createdAt: String? = null,
    val updatedAt: String? = null,
    
    // 同步状态
    val isSynced: Boolean = false
)

/**
 * 会员等级
 */
@Entity(tableName = "member_levels")
data class MemberLevel(
    @PrimaryKey
    val id: Int = 0,
    val name: String = "",
    val minConsumption: Double = 0.0,   // 最低消费要求
    val discount: Double = 1.0,          // 折扣率
    val icon: String? = null,
    val sortOrder: Int = 0
)

/**
 * 充值记录
 */
@Entity(tableName = "recharge_records")
data class RechargeRecord(
    @PrimaryKey
    val id: Int = 0,
    val memberId: Int = 0,
    val memberPhone: String = "",
    val amount: Double = 0.0,           // 充值金额
    val giftAmount: Double = 0.0,       // 赠送金额
    val paymentMethod: String = "",
    val remark: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false
)
