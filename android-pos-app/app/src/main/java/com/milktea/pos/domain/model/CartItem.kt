package com.milktea.pos.domain.model

import com.milktea.pos.data.remote.OrderItemRequest
import com.milktea.pos.data.remote.OrderItemToppingRequest

/**
 * 购物车商品项
 */
data class CartItem(
    val product: Product,
    val quantity: Int = 1,
    val size: Size? = null,
    val sugar: String = "标准糖",
    val ice: String = "正常冰",
    val toppings: List<Topping> = emptyList()
) {
    val unitPrice: Double
        get() = (size?.price ?: product.price) + toppings.sumOf { it.price }

    val totalPrice: Double
        get() = unitPrice * quantity
}

/**
 * CartItem 转 OrderItemRequest
 */
fun CartItem.toOrderItemRequest(): OrderItemRequest {
    return OrderItemRequest(
        productId = this.product.id,
        productName = this.product.name,
        price = this.unitPrice,
        quantity = this.quantity,
        specId = null,
        sugar = this.sugar,
        ice = this.ice,
        toppings = this.toppings.map {
            OrderItemToppingRequest(
                toppingId = 0,
                toppingName = it.name
            )
        }.takeIf { it.isNotEmpty() }
    )
}
