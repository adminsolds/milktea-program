package com.milktea.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.milktea.pos.data.repository.MemberRepository
import com.milktea.pos.domain.model.Member
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

/**
 * 会员管理 ViewModel
 */
@HiltViewModel
class MemberViewModel @Inject constructor(
    private val memberRepository: MemberRepository
) : ViewModel() {

    // 会员列表
    private val _members = MutableStateFlow<List<Member>>(emptyList())
    val members: StateFlow<List<Member>> = _members.asStateFlow()

    // 搜索关键词
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    // 加载状态
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // 错误信息
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadMembers()
    }

    /**
     * 加载会员列表
     */
    fun loadMembers() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            try {
                memberRepository.getMembers().collect { result ->
                    result.onSuccess { members ->
                        Timber.d("加载会员列表成功: ${members.size} 个会员")
                        _members.value = members
                        _isLoading.value = false
                    }.onFailure { error ->
                        Timber.e(error, "加载会员列表失败")
                        _error.value = error.message ?: "加载会员列表失败"
                        _isLoading.value = false
                    }
                }
            } catch (e: Exception) {
                Timber.e(e, "加载会员列表异常")
                _error.value = e.message ?: "加载会员列表失败"
                _isLoading.value = false
            }
        }
    }

    /**
     * 搜索关键词变化
     */
    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
        // 可以在这里实现本地搜索或远程搜索
    }

    /**
     * 添加会员
     */
    fun addMember(phone: String, name: String?, onSuccess: () -> Unit = {}, onError: (String) -> Unit = {}) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            memberRepository.createMember(phone, name)
                .onSuccess { member ->
                    Timber.d("创建会员成功: ${member.phone}")
                    // 重新加载会员列表
                    loadMembers()
                    _isLoading.value = false
                    onSuccess()
                }
                .onFailure { error ->
                    Timber.e(error, "创建会员失败")
                    _error.value = error.message ?: "创建会员失败"
                    _isLoading.value = false
                    onError(error.message ?: "创建会员失败")
                }
        }
    }

    /**
     * 会员充值
     */
    fun rechargeMember(memberId: Int, amount: Double, onSuccess: () -> Unit = {}, onError: (String) -> Unit = {}) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            memberRepository.rechargeMember(memberId, amount)
                .onSuccess { member ->
                    Timber.d("会员充值成功: ${member.phone}, 新余额: ${member.balance}")
                    // 重新加载会员列表
                    loadMembers()
                    _isLoading.value = false
                    onSuccess()
                }
                .onFailure { error ->
                    Timber.e(error, "会员充值失败")
                    _error.value = error.message ?: "会员充值失败"
                    _isLoading.value = false
                    onError(error.message ?: "会员充值失败")
                }
        }
    }

    /**
     * 清除错误
     */
    fun clearError() {
        _error.value = null
    }
}
