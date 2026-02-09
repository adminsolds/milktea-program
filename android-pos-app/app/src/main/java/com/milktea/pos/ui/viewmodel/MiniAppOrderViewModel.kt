package com.milktea.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.milktea.pos.data.repository.OrderRepository
import com.milktea.pos.domain.model.Order
import com.milktea.pos.domain.model.OrderStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class MiniAppOrderViewModel @Inject constructor(
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MiniAppOrderUiState())
    val uiState: StateFlow<MiniAppOrderUiState> = _uiState

    private val _orders = MutableStateFlow<List<Order>>(emptyList())
    val orders: StateFlow<List<Order>> = _orders

    private val _selectedStatus = MutableStateFlow<Int?>(null)
    val selectedStatus: StateFlow<Int?> = _selectedStatus

    init {
        loadOrders()
    }

    /**
     * 加载小程序订单列表
     */
    fun loadOrders(status: Int? = _selectedStatus.value) {
        viewModelScope.launch {
            Timber.d("开始加载小程序订单列表，状态: $status")
            _uiState.value = _uiState.value.copy(isLoading = true)
            orderRepository.getMiniAppOrders(status).collect { result ->
                result.onSuccess { orders ->
                    Timber.d("小程序订单加载成功: ${orders.size} 个订单")
                    _orders.value = orders
                    _uiState.value = _uiState.value.copy(isLoading = false, error = null)
                }.onFailure { error ->
                    Timber.e("小程序订单加载失败: ${error.message}")
                    _uiState.value = _uiState.value.copy(isLoading = false, error = error.message)
                }
            }
        }
    }

    /**
     * 筛选订单状态
     */
    fun filterByStatus(status: Int?) {
        _selectedStatus.value = status
        loadOrders(status)
    }

    /**
     * 更新订单状态
     */
    fun updateOrderStatus(orderId: Int, status: Int) {
        viewModelScope.launch {
            Timber.d("更新订单状态: orderId=$orderId, status=$status")
            _uiState.value = _uiState.value.copy(isUpdating = true)
            orderRepository.updateOrderStatus(orderId, status).onSuccess { updatedOrder ->
                Timber.d("订单状态更新成功")
                val currentOrders = _orders.value.toMutableList()
                val index = currentOrders.indexOfFirst { it.id == orderId }
                if (index >= 0) {
                    currentOrders[index] = updatedOrder
                    _orders.value = currentOrders
                }
                _uiState.value = _uiState.value.copy(isUpdating = false, error = null)
            }.onFailure { error ->
                Timber.e("订单状态更新失败: ${error.message}")
                _uiState.value = _uiState.value.copy(isUpdating = false, error = error.message)
            }
        }
    }

    /**
     * 打印订单
     */
    fun printOrder(orderId: Int) {
        viewModelScope.launch {
            Timber.d("打印订单: orderId=$orderId")
            orderRepository.printOrder(orderId).onSuccess {
                Timber.d("订单打印成功")
                _uiState.value = _uiState.value.copy(error = null)
            }.onFailure { error ->
                Timber.e("订单打印失败: ${error.message}")
                _uiState.value = _uiState.value.copy(error = error.message)
            }
        }
    }

    /**
     * 获取订单详情
     */
    fun getOrderDetail(orderId: Int) {
        viewModelScope.launch {
            Timber.d("获取订单详情: orderId=$orderId")
            _uiState.value = _uiState.value.copy(isLoading = true)
            orderRepository.getOrderById(orderId).onSuccess { order ->
                Timber.d("订单详情获取成功")
                val currentOrders = _orders.value.toMutableList()
                val index = currentOrders.indexOfFirst { it.id == orderId }
                if (index >= 0) {
                    currentOrders[index] = order
                    _orders.value = currentOrders
                }
                _uiState.value = _uiState.value.copy(isLoading = false, error = null)
            }.onFailure { error ->
                Timber.e("订单详情获取失败: ${error.message}")
                _uiState.value = _uiState.value.copy(isLoading = false, error = error.message)
            }
        }
    }

    /**
     * 刷新订单列表
     */
    fun refresh() {
        loadOrders()
    }

    /**
     * 清除错误
     */
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

data class MiniAppOrderUiState(
    val isLoading: Boolean = false,
    val isUpdating: Boolean = false,
    val error: String? = null
)