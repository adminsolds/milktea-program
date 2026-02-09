package com.milktea.pos.data.repository

import com.milktea.pos.data.remote.*
import com.milktea.pos.domain.model.Order
import com.milktea.pos.domain.model.OrderStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * 订单仓库（小程序订单管理）
 */
@Singleton
class OrderRepository @Inject constructor(
    private val apiService: ApiService
) {

    /**
     * 创建订单
     */
    suspend fun createOrder(
        orderType: String,
        paymentMethod: String,
        items: List<OrderItemRequest>,
        productTotal: Double,
        memberId: Int? = null,
        memberPhone: String? = null,
        remark: String? = null
    ): Result<Order> {
        return try {
            val request = CreateOrderRequest(
                orderType = orderType,
                paymentMethod = paymentMethod,
                items = items,
                productTotal = productTotal,
                memberId = memberId,
                memberPhone = memberPhone,
                remark = remark,
                isPos = true
            )
            val response = apiService.createOrder(request)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.message ?: "创建订单失败"))
                }
            } else {
                Result.failure(Exception("HTTP ${response.code()}: ${response.errorBody()?.string() ?: "Unknown error"}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * 获取小程序订单列表
     */
    fun getMiniAppOrders(status: Int? = null): Flow<Result<List<Order>>> = flow {
        try {
            val response = apiService.getOrders(
                status = status?.toString(),
                source = "miniapp"
            )
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    emit(Result.success(body.data?.list ?: emptyList()))
                } else {
                    emit(Result.failure(Exception(body?.message ?: "Unknown error")))
                }
            } else {
                emit(Result.failure(Exception("HTTP ${response.code()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * 获取订单详情
     */
    suspend fun getOrderById(orderId: Int): Result<Order> {
        return try {
            val response = apiService.getOrder(orderId)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.message ?: "获取订单详情失败"))
                }
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * 更新订单状态
     */
    suspend fun updateOrderStatus(orderId: Int, status: Int): Result<Order> {
        return try {
            val statusString = when (status) {
                0 -> "cancelled"
                1 -> "pending"
                2 -> "preparing"
                3 -> "completed"
                4 -> "delivering"
                5 -> "finished"
                6 -> "delivered"
                else -> "pending"
            }
            val request = UpdateStatusRequest(status = statusString)
            val response = apiService.updateOrderStatus(orderId, request)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.message ?: "更新状态失败"))
                }
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * 打印订单
     */
    suspend fun printOrder(orderId: Int): Result<Unit> {
        return try {
            val response = apiService.printOrder(orderId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
