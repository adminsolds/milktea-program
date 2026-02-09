package com.milktea.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import com.milktea.pos.domain.model.Order
import com.milktea.pos.domain.model.OrderStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * 订单管理 ViewModel
 */
class OrdersViewModel : ViewModel() {
    private val _orders = MutableStateFlow<List<Order>>(emptyList())
    val orders: StateFlow<List<Order>> = _orders

    private val _selectedTab = MutableStateFlow(OrderTab.ALL)
    val selectedTab: StateFlow<OrderTab> = _selectedTab

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun selectTab(tab: OrderTab) {
        _selectedTab.value = tab
        refreshOrders()
    }

    fun refreshOrders() {
        // 实现刷新逻辑
    }

    fun onOrderClick(order: Order) {
        // 显示订单详情
    }

    fun updateOrderStatus(order: Order, status: OrderStatus) {
        // 更新订单状态
    }

    fun printOrder(order: Order) {
        // 打印订单
    }
}

enum class OrderTab(val title: String) {
    ALL("全部"),
    PENDING("待制作"),
    COMPLETED("已完成")
}
