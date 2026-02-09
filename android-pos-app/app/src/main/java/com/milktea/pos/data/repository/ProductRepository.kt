package com.milktea.pos.data.repository

import com.milktea.pos.data.remote.ApiService
import com.milktea.pos.data.remote.ProductsResponse
import com.milktea.pos.domain.model.Category
import com.milktea.pos.domain.model.Product
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * 商品仓库
 */
@Singleton
class ProductRepository @Inject constructor(
    private val apiService: ApiService
) {

    /**
     * 获取商品列表
     */
    fun getProducts(): Flow<Result<List<Product>>> = flow {
        try {
            val response = apiService.getProducts()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    emit(Result.success(body.products))
                } else {
                    emit(Result.failure(Exception("获取商品失败：响应为空")))
                }
            } else {
                emit(Result.failure(Exception("HTTP ${response.code()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * 获取分类列表
     */
    fun getCategories(): Flow<Result<List<Category>>> = flow {
        try {
            val response = apiService.getCategories()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    emit(Result.success(body))
                } else {
                    emit(Result.failure(Exception("获取分类失败：响应为空")))
                }
            } else {
                emit(Result.failure(Exception("HTTP ${response.code()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * 根据ID获取商品
     */
    suspend fun getProductById(productId: Int): Result<Product> {
        return try {
            val response = apiService.getProduct(productId)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.message ?: "获取商品失败"))
                }
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
