package com.milktea.pos.data.remote

import com.google.gson.annotations.SerializedName
import com.milktea.pos.domain.model.*
import retrofit2.Response
import retrofit2.http.*

/**
 * API 接口定义
 */
interface ApiService {

    // ==================== 健康检查 ====================

    @GET("health")
    suspend fun getHealth(): Response<HealthResponse>

    // ==================== 商品相关 ====================

    @GET("products")
    suspend fun getProducts(): Response<ProductsResponse>

    @GET("products/{id}")
    suspend fun getProduct(@Path("id") id: Int): Response<ApiResponse<Product>>

    @GET("products/categories")
    suspend fun getCategories(): Response<List<Category>>

    // ==================== 订单相关 ====================

    @POST("orders")
    suspend fun createOrder(@Body request: CreateOrderRequest): Response<ApiResponse<Order>>

    @GET("orders")
    suspend fun getOrders(
        @Query("status") status: String? = null,
        @Query("source") source: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<PagedResponse<Order>>>

    @GET("orders/{id}")
    suspend fun getOrder(@Path("id") id: Int): Response<ApiResponse<Order>>

    @PUT("orders/{id}/status")
    suspend fun updateOrderStatus(
        @Path("id") id: Int,
        @Body request: UpdateStatusRequest
    ): Response<ApiResponse<Order>>

    @POST("orders/{id}/print")
    suspend fun printOrder(@Path("id") id: Int): Response<ApiResponse<Unit>>

    // ==================== 会员相关 ====================

    @GET("members")
    suspend fun getMembers(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): Response<ApiResponse<List<Member>>>

    @GET("members/phone/{phone}")
    suspend fun getMemberByPhone(@Path("phone") phone: String): Response<MemberResponse>

    @POST("members")
    suspend fun createMember(@Body request: CreateMemberRequest): Response<ApiResponse<Member>>

    @POST("members/{id}/recharge")
    suspend fun rechargeMember(
        @Path("id") id: Int,
        @Body request: RechargeRequest
    ): Response<ApiResponse<Member>>

    @GET("members/{id}/records")
    suspend fun getMemberRecords(@Path("id") id: Int): Response<ApiResponse<List<RechargeRecord>>>

    // ==================== 统计相关 ====================

    @GET("stats/sales")
    suspend fun getTodayStatistics(): Response<ApiResponse<TodayStatisticsResponse>>

    @GET("stats/orders")
    suspend fun getOrderStatistics(
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String
    ): Response<ApiResponse<OrderStatistics>>

    @GET("stats/products")
    suspend fun getProductStatistics(
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String
    ): Response<ApiResponse<List<ProductStatistic>>>

    // ==================== 登录相关 ====================

    @POST("admin/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginResponse>>

    @POST("admin/logout")
    suspend fun logout(): Response<ApiResponse<Unit>>
}

// ==================== 请求数据类 ====================

data class CreateOrderRequest(
    @SerializedName("order_type") val orderType: String,
    @SerializedName("payment_method") val paymentMethod: String,
    @SerializedName("items") val items: List<OrderItemRequest>,
    @SerializedName("store_id") val storeId: Int = 1,           // 默认店铺ID
    @SerializedName("product_total") val productTotal: Double,       // 商品总金额
    @SerializedName("user_id") val memberId: Int? = null,
    @SerializedName("phone") val memberPhone: String? = null,
    @SerializedName("remark") val remark: String? = null,
    @SerializedName("pickup_time") val pickupTime: String? = null,
    @SerializedName("receiver_name") val contactName: String? = null,
    @SerializedName("receiver_phone") val contactPhone: String? = null,
    @SerializedName("receiver_address") val address: String? = null,
    @SerializedName("is_pos") val isPos: Boolean = true       // POS现场点单标记
)

data class OrderItemRequest(
    @SerializedName("product_id") val productId: Int,
    @SerializedName("product_name") val productName: String,
    @SerializedName("price") val price: Double,
    @SerializedName("quantity") val quantity: Int,
    @SerializedName("spec_id") val specId: Int? = null,
    @SerializedName("sugar") val sugar: String? = null,
    @SerializedName("ice") val ice: String? = null,
    @SerializedName("toppings") val toppings: List<OrderItemToppingRequest>? = null,
    @SerializedName("remark") val remark: String? = null
)

data class OrderItemToppingRequest(
    @SerializedName("topping_id") val toppingId: Int,
    @SerializedName("topping_name") val toppingName: String
)

data class UpdateStatusRequest(
    val status: String
)

data class CreateMemberRequest(
    val phone: String,
    val name: String? = null
)

data class RechargeRequest(
    val amount: Double,
    val paymentMethod: String,
    val remark: String? = null
)

data class LoginRequest(
    val username: String,
    val password: String
)

// ==================== 响应数据类 ====================

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null,
    val error: String? = null
)

/**
 * 会员查询响应（后端返回的是 member 字段而不是 data）
 */
data class MemberResponse(
    val success: Boolean,
    val member: Member? = null,
    val message: String? = null,
    val error: String? = null
)

data class PagedResponse<T>(
    val list: List<T>,
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int
)

/**
 * 商品列表响应（后端直接返回的格式）
 */
data class ProductsResponse(
    val total: Int,
    val page: Int,
    val limit: Int,
    val products: List<com.milktea.pos.domain.model.Product>
)

data class LoginResponse(
    val token: String,
    val admin: AdminInfo
)

data class AdminInfo(
    val id: Int,
    val username: String,
    val name: String?,
    val role: String
)

// ==================== 健康检查 ====================

data class HealthResponse(
    val status: String,
    val message: String,
    val timestamp: String
)

// ==================== 统计数据类 ====================

data class TodayStatisticsResponse(
    val revenue: Double,
    val orderCount: Int,
    val averageOrderValue: Double,
    val memberRevenue: Double,
    val newMembers: Int,
    val pendingOrders: Int
)

data class OrderStatistics(
    val totalRevenue: Double,
    val totalOrders: Int,
    val averageOrderValue: Double,
    val hourlyDistribution: List<HourlyStat>,
    val paymentDistribution: List<PaymentStat>
)

data class HourlyStat(
    val hour: Int,
    val orderCount: Int,
    val revenue: Double
)

data class PaymentStat(
    val method: String,
    val count: Int,
    val amount: Double
)

data class ProductStatistic(
    val productId: Int,
    val productName: String,
    val quantity: Int,
    val revenue: Double
)
