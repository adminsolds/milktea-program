package com.milktea.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.milktea.pos.data.repository.StatisticsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

/**
 * 统计页面 ViewModel
 */
@HiltViewModel
class StatisticsViewModel @Inject constructor(
    private val statisticsRepository: StatisticsRepository
) : ViewModel() {

    private val _todayStats = MutableStateFlow(TodayStatistics())
    val todayStats: StateFlow<TodayStatistics> = _todayStats.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadTodayStatistics()
    }

    /**
     * 加载今日统计数据
     */
    fun loadTodayStatistics() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                // 获取今日日期范围
                val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val today = dateFormat.format(Date())

                Timber.d("加载今日统计数据: $today")

                statisticsRepository.getTodayStatistics().collect { result ->
                    result.onSuccess { response ->
                        Timber.d("今日统计数据: revenue=${response.revenue}, orders=${response.orderCount}")
                        _todayStats.value = TodayStatistics(
                            revenue = response.revenue,
                            orderCount = response.orderCount,
                            averageOrderValue = response.averageOrderValue,
                            memberRevenue = response.memberRevenue,
                            newMembers = response.newMembers,
                            pendingOrders = response.pendingOrders
                        )
                        _isLoading.value = false
                    }.onFailure { error ->
                        Timber.e(error, "加载今日统计失败")
                        _error.value = error.message ?: "加载统计数据失败"
                        _isLoading.value = false
                    }
                }
            } catch (e: Exception) {
                Timber.e(e, "加载统计数据异常")
                _error.value = e.message ?: "加载统计数据失败"
                _isLoading.value = false
            }
        }
    }

    /**
     * 刷新统计数据
     */
    fun refreshStatistics() {
        loadTodayStatistics()
    }

    /**
     * 清除错误
     */
    fun clearError() {
        _error.value = null
    }
}

data class TodayStatistics(
    val totalOrders: Int = 0,
    val totalRevenue: Double = 0.0,
    val averageOrderValue: Double = 0.0,
    val paymentStats: List<PaymentStat> = emptyList(),
    val topProducts: List<ProductStatistic> = emptyList(),
    val revenue: Double = 0.0,
    val orderCount: Int = 0,
    val dineInCount: Int = 0,
    val dineInAmount: Double = 0.0,
    val takeoutCount: Int = 0,
    val takeoutAmount: Double = 0.0,
    val deliveryCount: Int = 0,
    val deliveryAmount: Double = 0.0,
    val memberRevenue: Double = 0.0,
    val newMembers: Int = 0,
    val pendingOrders: Int = 0
)

data class PaymentStat(
    val method: String,
    val count: Int,
    val amount: Double
)

data class ProductStatistic(
    val id: Int,
    val name: String,
    val quantity: Int,
    val revenue: Double
)
