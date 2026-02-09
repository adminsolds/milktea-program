package com.milktea.pos.data.repository

import com.milktea.pos.data.remote.ApiService
import com.milktea.pos.data.remote.TodayStatisticsResponse
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * 统计仓库
 */
@Singleton
class StatisticsRepository @Inject constructor(
    private val apiService: ApiService
) {

    /**
     * 获取今日统计数据
     */
    fun getTodayStatistics(): Flow<Result<TodayStatisticsResponse>> = flow {
        try {
            val response = apiService.getTodayStatistics()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    emit(Result.success(body.data))
                } else {
                    emit(Result.failure(Exception(body?.message ?: "获取统计数据失败")))
                }
            } else {
                emit(Result.failure(Exception("HTTP ${response.code()}: ${response.errorBody()?.string() ?: "Unknown error"}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * 获取订单统计
     */
    suspend fun getOrderStatistics(startDate: String, endDate: String): Result<com.milktea.pos.data.remote.OrderStatistics> {
        return try {
            val response = apiService.getOrderStatistics(startDate, endDate)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.message ?: "获取订单统计失败"))
                }
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * 获取商品统计
     */
    suspend fun getProductStatistics(startDate: String, endDate: String): Result<List<com.milktea.pos.data.remote.ProductStatistic>> {
        return try {
            val response = apiService.getProductStatistics(startDate, endDate)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.message ?: "获取商品统计失败"))
                }
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
