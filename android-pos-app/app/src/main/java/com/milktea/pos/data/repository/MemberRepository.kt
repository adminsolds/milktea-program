package com.milktea.pos.data.repository

import com.milktea.pos.data.remote.ApiService
import com.milktea.pos.data.remote.CreateMemberRequest
import com.milktea.pos.data.remote.RechargeRequest
import com.milktea.pos.domain.model.Member
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * 会员仓库
 */
@Singleton
class MemberRepository @Inject constructor(
    private val apiService: ApiService
) {

    /**
     * 获取会员列表
     */
    fun getMembers(): Flow<Result<List<Member>>> = flow {
        try {
            val response = apiService.getMembers()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    // 后端直接返回数组，不是 PagedResponse
                    @Suppress("UNCHECKED_CAST")
                    val members = body.data as? List<Member> ?: emptyList()
                    emit(Result.success(members))
                } else {
                    emit(Result.failure(Exception(body?.message ?: "获取会员列表失败")))
                }
            } else {
                emit(Result.failure(Exception("HTTP ${response.code()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * 根据手机号查询会员
     */
    fun getMemberByPhone(phone: String): Flow<Result<Member>> = flow {
        try {
            val response = apiService.getMemberByPhone(phone)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.member != null) {
                    emit(Result.success(body.member))
                } else {
                    emit(Result.failure(Exception(body?.message ?: "会员不存在")))
                }
            } else {
                emit(Result.failure(Exception("HTTP ${response.code()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    /**
     * 创建会员
     */
    suspend fun createMember(phone: String, name: String?): Result<Member> {
        return try {
            val request = CreateMemberRequest(phone = phone, name = name)
            val response = apiService.createMember(request)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.message ?: "创建会员失败"))
                }
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * 会员充值
     */
    suspend fun rechargeMember(memberId: Int, amount: Double, paymentMethod: String = "CASH"): Result<Member> {
        return try {
            val request = RechargeRequest(amount = amount, paymentMethod = paymentMethod)
            val response = apiService.rechargeMember(memberId, request)
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.message ?: "充值失败"))
                }
            } else {
                Result.failure(Exception("HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
