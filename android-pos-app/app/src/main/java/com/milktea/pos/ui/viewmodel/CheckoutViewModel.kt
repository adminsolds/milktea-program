package com.milktea.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.milktea.pos.data.repository.MemberRepository
import com.milktea.pos.data.repository.OrderRepository
import com.milktea.pos.domain.model.CartItem
import com.milktea.pos.domain.model.Member
import com.milktea.pos.domain.model.Order
import com.milktea.pos.domain.model.PaymentMethod
import com.milktea.pos.domain.model.toOrderItemRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

/**
 * 结算页面 ViewModel
 */
@HiltViewModel
class CheckoutViewModel @Inject constructor(
    private val memberRepository: MemberRepository,
    private val orderRepository: OrderRepository
) : ViewModel() {

    // UI 状态
    private val _uiState = MutableStateFlow(CheckoutUiState())
    val uiState: StateFlow<CheckoutUiState> = _uiState.asStateFlow()

    // 当前会员
    private val _member = MutableStateFlow<Member?>(null)
    val member: StateFlow<Member?> = _member.asStateFlow()

    /**
     * 查询会员
     */
    fun queryMember(phone: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            memberRepository.getMemberByPhone(phone).collect { result ->
                result.onSuccess { member ->
                    Timber.d("查询会员成功: ${member.phone}, 余额: ${member.balance}, 折扣: ${member.discount}")
                    _member.value = member
                    _uiState.value = _uiState.value.copy(isLoading = false, error = null)
                }.onFailure { error ->
                    Timber.e("查询会员失败: ${error.message}")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "会员不存在"
                    )
                }
            }
        }
    }

    /**
     * 清除会员
     */
    fun clearMember() {
        _member.value = null
    }

    /**
     * 结算
     */
    fun checkout(
        cartItems: List<CartItem>,
        paymentMethod: PaymentMethod,
        remark: String,
        onSuccess: (Order) -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            try {
                // 检查购物车是否为空
                if (cartItems.isEmpty()) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "购物车不能为空"
                    )
                    onError("购物车不能为空")
                    return@launch
                }

                // 转换购物车商品为订单商品请求
                val orderItems = cartItems.map { it.toOrderItemRequest() }

                // 获取会员信息
                val currentMember = _member.value

                // 检查储值支付时余额是否充足
                if (paymentMethod == PaymentMethod.WALLET) {
                    if (currentMember == null) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = "储值支付需要选择会员"
                        )
                        onError("储值支付需要选择会员")
                        return@launch
                    }

                    val totalAmount = cartItems.sumOf { it.totalPrice }
                    if (currentMember.balance < totalAmount) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = "会员余额不足，当前余额: ¥${currentMember.balance}"
                        )
                        onError("会员余额不足，当前余额: ¥${currentMember.balance}")
                        return@launch
                    }
                }

                // 调用创建订单 API
                val paymentMethodString = when (paymentMethod) {
                    PaymentMethod.CASH -> "cash"
                    PaymentMethod.WECHAT -> "wechat"
                    PaymentMethod.ALIPAY -> "alipay"
                    PaymentMethod.WALLET -> "wallet"
                }

                // 计算商品总金额
                val productTotal = cartItems.sumOf { it.totalPrice }
                
                Timber.d("创建订单: 支付方式=$paymentMethodString, 会员ID=${currentMember?.id}, 商品数量=${orderItems.size}, 总金额=$productTotal")

                val result = orderRepository.createOrder(
                    orderType = "pos",
                    paymentMethod = paymentMethodString,
                    items = orderItems,
                    productTotal = productTotal,
                    memberId = currentMember?.id,
                    memberPhone = currentMember?.phone,
                    remark = remark.takeIf { it.isNotBlank() }
                )

                result.onSuccess { order ->
                    Timber.d("订单创建成功: ${order.id}")
                    clearMember()
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onSuccess(order)
                }.onFailure { error ->
                    Timber.e(error, "订单创建失败")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "创建订单失败"
                    )
                    onError(error.message ?: "创建订单失败")
                }

            } catch (e: Exception) {
                Timber.e(e, "结算失败")
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "结算失败"
                )
                onError(e.message ?: "结算失败")
            }
        }
    }
}

/**
 * 结算页面 UI 状态
 */
data class CheckoutUiState(
    val isLoading: Boolean = false,
    val error: String? = null
)
