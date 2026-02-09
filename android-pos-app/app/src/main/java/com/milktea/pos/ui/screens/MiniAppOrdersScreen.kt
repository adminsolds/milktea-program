package com.milktea.pos.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Print
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.milktea.pos.domain.model.Order
import com.milktea.pos.domain.model.OrderStatus
import com.milktea.pos.ui.viewmodel.MiniAppOrderViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MiniAppOrdersScreen(
    onBack: () -> Unit,
    viewModel: MiniAppOrderViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val orders by viewModel.orders.collectAsState()
    val selectedStatus by viewModel.selectedStatus.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("小程序订单") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "返回")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            StatusFilterRow(
                selectedStatus = selectedStatus,
                onStatusSelected = { status ->
                    viewModel.filterByStatus(status)
                }
            )

            when {
                uiState.isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                orders.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("暂无订单", style = MaterialTheme.typography.bodyLarge)
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(orders) { order ->
                            OrderItemCard(
                                order = order,
                                onStatusUpdate = { status ->
                                    viewModel.updateOrderStatus(order.id, status)
                                },
                                onPrint = {
                                    viewModel.printOrder(order.id)
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatusFilterRow(
    selectedStatus: Int?,
    onStatusSelected: (Int?) -> Unit
) {
    val statuses = listOf(
        null to "全部",
        1 to "已下单",
        2 to "制作中",
        3 to "制作完成",
        4 to "配送中",
        5 to "已完成",
        0 to "已取消"
    )

    ScrollableTabRow(
        selectedTabIndex = statuses.indexOfFirst { it.first == selectedStatus },
        modifier = Modifier.fillMaxWidth()
    ) {
        statuses.forEach { (status, label) ->
            Tab(
                selected = selectedStatus == status,
                onClick = { onStatusSelected(status) },
                text = { Text(label) }
            )
        }
    }
}

@Composable
fun OrderItemCard(
    order: Order,
    onStatusUpdate: (Int) -> Unit,
    onPrint: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "订单号: ${order.orderNo}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                StatusChip(order.status)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "用户: ${order.userName ?: order.userPhone ?: "未知"}",
                style = MaterialTheme.typography.bodyMedium
            )

            if (order.receiverPhone != null) {
                Text(
                    text = "联系电话: ${order.receiverPhone}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            if (order.receiverAddress != null) {
                Text(
                    text = "配送地址: ${order.receiverAddress}",
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            order.items.forEach { item ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "${item.productName} x${item.quantity}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "¥${String.format("%.2f", item.totalPrice)}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "合计: ¥${String.format("%.2f", order.finalPrice)}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    IconButton(onClick = onPrint) {
                        Icon(Icons.Default.Print, "打印")
                    }

                    StatusUpdateButton(
                        currentStatus = order.status,
                        onUpdate = onStatusUpdate
                    )
                }
            }

            if (order.remark != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "备注: ${order.remark}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (order.createdAt != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "下单时间: ${formatDateTime(order.createdAt)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun StatusChip(status: Int) {
    val (color, text) = when (status) {
        0 -> Color.Gray to "已取消"
        1 -> Color(0xFFFF9800) to "已下单"
        2 -> Color(0xFF2196F3) to "制作中"
        3 -> Color(0xFF4CAF50) to "制作完成"
        4 -> Color(0xFF9C27B0) to "配送中"
        5 -> Color(0xFF4CAF50) to "已完成"
        6 -> Color(0xFF4CAF50) to "已送达"
        else -> Color.Gray to "未知"
    }

    Surface(
        color = color.copy(alpha = 0.1f),
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = text,
            color = color,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

@Composable
fun StatusUpdateButton(
    currentStatus: Int,
    onUpdate: (Int) -> Unit
) {
    val nextStatus = when (currentStatus) {
        1 -> 2
        2 -> 3
        3 -> 4
        4 -> 5
        else -> null
    }

    nextStatus?.let { status ->
        val statusText = OrderStatus.values().find { it.value == status }?.displayName ?: "更新状态"
        Button(
            onClick = { onUpdate(status) },
            enabled = currentStatus != 0
        ) {
            Text(statusText)
        }
    }
}

fun formatDateTime(dateTimeString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        inputFormat.timeZone = TimeZone.getTimeZone("UTC")
        val date = inputFormat.parse(dateTimeString)
        
        val outputFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
        outputFormat.format(date ?: Date())
    } catch (e: Exception) {
        dateTimeString
    }
}