package com.milktea.pos.domain.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.milktea.pos.data.local.Converters

/**
 * 订单数据模型（小程序订单）
 */
@Entity(tableName = "orders")
@TypeConverters(Converters::class)
data class Order(
    @PrimaryKey
    val id: Int = 0,
    val orderNo: String = "",
    val orderType: String = "self",
    val status: Int = 1,
    val paymentMethod: String = "wechat",
    
    // 金额信息
    val productTotal: Double = 0.0,
    val deliveryFee: Double = 0.0,
    val memberDiscount: Double = 0.0,
    val couponDiscount: Double = 0.0,
    val finalPrice: Double = 0.0,
    
    // 会员信息
    val userId: Int? = null,
    val userPhone: String? = null,
    val userName: String? = null,
    
    // 联系信息
    val receiverName: String? = null,
    val receiverPhone: String? = null,
    val receiverAddress: String? = null,
    
    // 订单备注
    val remark: String? = null,
    val pickupTime: String? = null,
    
    // 订单来源
    val source: String = "miniapp",
    
    // 商品列表
    val items: List<OrderItem> = emptyList(),
    
    // 时间戳
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val payTime: String? = null,
    val completeTime: String? = null,
    
    // 店铺信息
    val storeId: Int? = null,
    val storeName: String? = null,
    val storeAddress: String? = null,
    val storePhone: String? = null
)

/**
 * 订单商品项
 */
data class OrderItem(
    val id: Int = 0,
    val productId: Int,
    val productName: String,
    val productImage: String? = null,
    val quantity: Int = 1,
    val price: Double,
    val totalPrice: Double,

    // 规格
    val specId: Int? = null,
    val specName: String? = null,

    // 定制选项
    val sugar: String? = null,
    val ice: String? = null,
    val toppings: String? = null,  // 后端返回的是JSON字符串

    // 备注
    val remark: String? = null
)

/**
 * 订单商品配料
 */
data class OrderItemTopping(
    val toppingId: Int,
    val toppingName: String,
    val price: Double
)

/**
 * 订单状态
 */
enum class OrderStatus(val value: Int, val displayName: String) {
    CANCELLED(0, "已取消"),
    PENDING(1, "已下单"),
    PREPARING(2, "制作中"),
    COMPLETED(3, "制作完成"),
    DELIVERING(4, "配送中/待取餐"),
    FINISHED(5, "已完成"),
    DELIVERED(6, "已送达")
}

/**
 * 支付方式
 */
enum class PaymentMethod(val value: String, val displayName: String) {
    CASH("cash", "现金"),
    WECHAT("wechat", "微信支付"),
    ALIPAY("alipay", "支付宝"),
    WALLET("wallet", "储值支付")
}
