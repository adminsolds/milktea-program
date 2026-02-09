package com.milktea.pos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.milktea.pos.domain.model.CartItem
import com.milktea.pos.domain.model.Member
import com.milktea.pos.domain.model.PaymentMethod
import com.milktea.pos.ui.theme.PrimaryColor
import com.milktea.pos.ui.theme.SuccessColor
import com.milktea.pos.ui.viewmodel.CheckoutViewModel
import com.milktea.pos.ui.viewmodel.OrderViewModel

/**
 * 结算页面
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun CheckoutScreen(
    onBack: () -> Unit,
    orderViewModel: OrderViewModel = hiltViewModel(),
    checkoutViewModel: CheckoutViewModel = hiltViewModel()
) {
    val uiState by checkoutViewModel.uiState.collectAsState()
    val cartItems by orderViewModel.cartItems.collectAsState()
    val member by checkoutViewModel.member.collectAsState()

    var selectedPayment by remember { mutableStateOf(PaymentMethod.CASH) }
    var receivedAmount by remember { mutableStateOf("") }
    var remark by remember { mutableStateOf("") }
    var showMemberDialog by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val totalAmount = cartItems.fold(0.0) { acc, item -> acc + item.totalPrice }
    val memberDiscount = member?.let { calculateMemberDiscount(totalAmount, it) } ?: 0.0
    val finalAmount = totalAmount - memberDiscount

    // 如果有会员且余额足够，默认选择储值支付
    LaunchedEffect(member) {
        member?.let {
            if (it.balance >= finalAmount) {
                selectedPayment = PaymentMethod.WALLET
            }
        }
    }

    // 显示错误对话框
    errorMessage?.let { message ->
        AlertDialog(
            onDismissRequest = { errorMessage = null },
            title = { Text("支付失败") },
            text = { Text(message) },
            confirmButton = {
                TextButton(onClick = { errorMessage = null }) {
                    Text("确定")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("订单结算") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        },
        bottomBar = {
            CheckoutBottomBar(
                totalAmount = totalAmount,
                memberDiscount = memberDiscount,
                finalAmount = finalAmount,
                isLoading = uiState.isLoading,
                onConfirm = {
                    if (!uiState.isLoading) {
                        checkoutViewModel.checkout(
                            cartItems = cartItems,
                            paymentMethod = selectedPayment,
                            remark = remark,
                            onSuccess = {
                                orderViewModel.clearCart()
                                onBack()
                            },
                            onError = { error ->
                                errorMessage = error
                            }
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 会员信息
            item {
                MemberInfoCard(
                    member = member,
                    onAddMember = { showMemberDialog = true },
                    onClearMember = { checkoutViewModel.clearMember() }
                )
            }

            // 商品列表
            item {
                Text(
                    text = "商品明细",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            items(cartItems) { item ->
                CheckoutItemRow(item = item)
            }

            // 金额明细
            item {
                AmountDetailCard(
                    totalAmount = totalAmount,
                    memberDiscount = memberDiscount,
                    finalAmount = finalAmount
                )
            }

            // 支付方式
            item {
                PaymentMethodCard(
                    selectedMethod = selectedPayment,
                    onMethodSelected = { selectedPayment = it },
                    member = member,
                    finalAmount = finalAmount
                )
            }

            // 现金支付 - 实收金额
            if (selectedPayment == PaymentMethod.CASH) {
                item {
                    OutlinedTextField(
                        value = receivedAmount,
                        onValueChange = { receivedAmount = it },
                        label = { Text("实收金额") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        prefix = { Text("¥") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    val change = receivedAmount.toDoubleOrNull()?.minus(finalAmount) ?: 0.0
                    if (change > 0) {
                        Text(
                            text = "找零: ¥${String.format("%.2f", change)}",
                            color = SuccessColor,
                            style = MaterialTheme.typography.titleMedium,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }
            }

            // 储值支付提示
            member?.let { m ->
                if (selectedPayment == PaymentMethod.WALLET) {
                    item {
                        val balanceAfter = m.balance - finalAmount
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = if (balanceAfter >= 0)
                                    SuccessColor.copy(alpha = 0.1f)
                                else
                                    MaterialTheme.colorScheme.errorContainer
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Text(
                                    text = "储值支付",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "当前余额: ¥${String.format("%.2f", m.balance)}",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                Text(
                                    text = "支付后余额: ¥${String.format("%.2f", balanceAfter)}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = if (balanceAfter >= 0) SuccessColor else MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }
            }

            // 备注
            item {
                OutlinedTextField(
                    value = remark,
                    onValueChange = { remark = it },
                    label = { Text("订单备注") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
            }
        }
    }

    // 查询会员弹窗
    if (showMemberDialog) {
        QueryMemberDialog(
            onDismiss = { showMemberDialog = false },
            onQuery = { phone ->
                checkoutViewModel.queryMember(phone)
                showMemberDialog = false
            }
        )
    }
}

/**
 * 会员信息卡片
 */
@Composable
private fun MemberInfoCard(
    member: Member?,
    onAddMember: () -> Unit,
    onClearMember: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            member?.let { m ->
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = m.name ?: "未命名会员",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Medium
                        )
                        if (m.levelName != null) {
                            Surface(
                                color = PrimaryColor.copy(alpha = 0.1f),
                                shape = MaterialTheme.shapes.small
                            ) {
                                Text(
                                    text = m.levelName,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = PrimaryColor,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                    Text(
                        text = m.phone,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (m.discount < 1.0) {
                        Text(
                            text = "会员折扣: ${(m.discount * 10).toInt()}折",
                            style = MaterialTheme.typography.bodySmall,
                            color = SuccessColor
                        )
                    }
                }
                Column(
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = "余额: ¥${String.format("%.2f", m.balance)}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                    Text(
                        text = "积分: ${m.points}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    TextButton(
                        onClick = onClearMember,
                        colors = ButtonDefaults.textButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("清除")
                    }
                }
            } ?: run {
                Text(
                    text = "散客订单",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedButton(onClick = onAddMember) {
                    Icon(Icons.Default.PersonAdd, contentDescription = null)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("查询会员")
                }
            }
        }
    }
}

/**
 * 结算商品项
 */
@Composable
private fun CheckoutItemRow(item: CartItem) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            val sizeText = item.size?.name?.let { "($it)" } ?: ""
            Text(
                text = item.product.name + sizeText,
                style = MaterialTheme.typography.bodyMedium
            )
            val options = mutableListOf<String>()
            options.add(item.sugar)
            options.add(item.ice)
            options.addAll(item.toppings.map { it.name })
            Text(
                text = options.joinToString(" / "),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Text(
            text = "x${item.quantity}",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        Text(
            text = "¥${String.format("%.2f", item.totalPrice)}",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

/**
 * 金额明细卡片
 */
@Composable
private fun AmountDetailCard(
    totalAmount: Double,
    memberDiscount: Double,
    finalAmount: Double
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("商品金额")
                Text("¥${String.format("%.2f", totalAmount)}")
            }

            if (memberDiscount > 0) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("会员优惠")
                    Text(
                        "-¥${String.format("%.2f", memberDiscount)}",
                        color = SuccessColor
                    )
                }
            }

            Divider()

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "应付金额",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "¥${String.format("%.2f", finalAmount)}",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryColor
                )
            }
        }
    }
}

/**
 * 支付方式卡片
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun PaymentMethodCard(
    selectedMethod: PaymentMethod,
    onMethodSelected: (PaymentMethod) -> Unit,
    member: Member?,
    finalAmount: Double
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "支付方式",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // 现金支付 - 始终可用
                PaymentMethodChip(
                    method = PaymentMethod.CASH,
                    isSelected = selectedMethod == PaymentMethod.CASH,
                    onClick = { onMethodSelected(PaymentMethod.CASH) }
                )

                // 微信支付
                PaymentMethodChip(
                    method = PaymentMethod.WECHAT,
                    isSelected = selectedMethod == PaymentMethod.WECHAT,
                    onClick = { onMethodSelected(PaymentMethod.WECHAT) }
                )

                // 支付宝
                PaymentMethodChip(
                    method = PaymentMethod.ALIPAY,
                    isSelected = selectedMethod == PaymentMethod.ALIPAY,
                    onClick = { onMethodSelected(PaymentMethod.ALIPAY) }
                )

                // 储值支付 - 仅当会员余额足够时可用
                member?.let { m ->
                    if (m.balance >= finalAmount) {
                        PaymentMethodChip(
                            method = PaymentMethod.WALLET,
                            isSelected = selectedMethod == PaymentMethod.WALLET,
                            onClick = { onMethodSelected(PaymentMethod.WALLET) }
                        )
                    }
                }
            }

            // 储值支付不可用提示
            member?.let { m ->
                if (m.balance < finalAmount) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "储值余额不足 (当前余额: ¥${String.format("%.2f", m.balance)})",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

/**
 * 支付方式选择芯片
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PaymentMethodChip(
    method: PaymentMethod,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val (icon, label) = when (method) {
        PaymentMethod.CASH -> Icons.Default.Payments to "现金"
        PaymentMethod.WECHAT -> Icons.Default.Chat to "微信支付"
        PaymentMethod.ALIPAY -> Icons.Default.AccountBalanceWallet to "支付宝"
        PaymentMethod.WALLET -> Icons.Default.CardMembership to "储值支付"
    }

    FilterChip(
        selected = isSelected,
        onClick = onClick,
        leadingIcon = {
            Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
        },
        label = { Text(label) }
    )
}

/**
 * 结算底部栏
 */
@Composable
private fun CheckoutBottomBar(
    totalAmount: Double,
    memberDiscount: Double,
    finalAmount: Double,
    isLoading: Boolean,
    onConfirm: () -> Unit
) {
    Surface(
        tonalElevation = 3.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                if (memberDiscount > 0) {
                    Text(
                        text = "优惠: ¥${String.format("%.2f", memberDiscount)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = SuccessColor
                    )
                }
                Text(
                    text = "合计: ¥${String.format("%.2f", finalAmount)}",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryColor
                )
            }

            Button(
                onClick = onConfirm,
                enabled = !isLoading && finalAmount > 0,
                modifier = Modifier.height(48.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("确认收款")
                }
            }
        }
    }
}

/**
 * 查询会员弹窗
 */
@Composable
private fun QueryMemberDialog(
    onDismiss: () -> Unit,
    onQuery: (String) -> Unit
) {
    var phone by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("查询会员") },
        text = {
            Column {
                Text(
                    text = "请输入会员手机号",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { 
                        // 只允许输入数字，最多11位
                        if (it.length <= 11 && it.all { char -> char.isDigit() }) {
                            phone = it
                        }
                    },
                    label = { Text("手机号") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onQuery(phone) },
                enabled = phone.length == 11
            ) {
                Text("查询")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}

/**
 * 计算会员折扣
 */
private fun calculateMemberDiscount(totalAmount: Double, member: Member): Double {
    return if (member.discount < 1.0) {
        totalAmount * (1 - member.discount)
    } else {
        0.0
    }
}
