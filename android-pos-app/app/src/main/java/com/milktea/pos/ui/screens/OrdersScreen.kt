package com.milktea.pos.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.milktea.pos.domain.model.Order
import com.milktea.pos.domain.model.OrderStatus
import com.milktea.pos.ui.theme.*
import com.milktea.pos.ui.viewmodel.OrdersViewModel
import com.milktea.pos.ui.viewmodel.OrderTab
import java.text.SimpleDateFormat
import java.util.*

/**
 * 订单管理页面
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    viewModel: OrdersViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
) {
    val orders by viewModel.orders.collectAsState()
    val selectedTab by viewModel.selectedTab.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("订单管理") },
                actions = {
                    IconButton(onClick = viewModel::refreshOrders) {
                        Icon(Icons.Default.Refresh, contentDescription = "刷新")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Tab 切换
            TabRow(selectedTabIndex = selectedTab.ordinal) {
                OrderTab.values().forEachIndexed { index, tab ->
                    Tab(
                        selected = selectedTab.ordinal == index,
                        onClick = { viewModel.selectTab(tab) },
                        text = { Text(tab.title) }
                    )
                }
            }

            // 订单列表
            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                OrderList(
                    orders = orders,
                    onOrderClick = viewModel::onOrderClick,
                    onStatusUpdate = viewModel::updateOrderStatus,
                    onPrint = viewModel::printOrder
                )
            }
        }
    }
}

/**
 * 订单列表
 */
@Composable
private fun OrderList(
    orders: List<Order>,
    onOrderClick: (Order) -> Unit,
    onStatusUpdate: (Order, OrderStatus) -> Unit,
    onPrint: (Order) -> Unit
) {
    if (orders.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                "暂无订单",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(orders) { order ->
                OrderCard(
                    order = order,
                    onClick = { onOrderClick(order) },
                    onStatusUpdate = { onStatusUpdate(order, it) },
                    onPrint = { onPrint(order) }
                )
            }
        }
    }
}

/**
 * 订单卡片
 */
@Composable
private fun OrderCard(
    order: Order,
    onClick: () -> Unit,
    onStatusUpdate: (OrderStatus) -> Unit,
    onPrint: () -> Unit
) {
    val dateFormat = SimpleDateFormat("MM-dd HH:mm", Locale.CHINA)
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 订单头部
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "#${order.orderNo}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = formatOrderDate(order.createdAt, dateFormat),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                OrderStatusChip(statusCode = order.status)
            }

            Divider(modifier = Modifier.padding(vertical = 12.dp))

            // 商品列表（显示前3个）
            order.items.take(3).forEach { item ->
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
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            if (order.items.size > 3) {
                Text(
                    text = "...还有 ${order.items.size - 3} 件商品",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Divider(modifier = Modifier.padding(vertical = 12.dp))

            // 底部信息
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 会员信息
                if (order.userPhone != null) {
                    Text(
                        text = "会员: ${order.userName ?: order.userPhone}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    Text(
                        text = "散客",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // 金额
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "合计: ¥${String.format("%.2f", order.finalPrice)}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryColor
                    )
                }
            }

            // 操作按钮
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 打印按钮
                OutlinedButton(
                    onClick = onPrint,
                    modifier = Modifier.padding(end = 8.dp)
                ) {
                    Icon(
                        Icons.Default.Print,
                        contentDescription = "打印",
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("打印")
                }

                // 状态更新按钮
                StatusActionButtons(
                    currentStatus = order.status,
                    onStatusUpdate = onStatusUpdate
                )
            }
        }
    }
}

/**
 * 格式化订单日期
 */
private fun formatOrderDate(createdAt: String?, dateFormat: SimpleDateFormat): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        inputFormat.timeZone = TimeZone.getTimeZone("UTC")
        val date = inputFormat.parse(createdAt ?: "") ?: Date()
        dateFormat.format(date)
    } catch (e: Exception) {
        createdAt ?: ""
    }
}

/**
 * 状态操作按钮
 */
@Composable
private fun StatusActionButtons(
    currentStatus: Int,
    onStatusUpdate: (OrderStatus) -> Unit
) {
    when (currentStatus) {
        1 -> { // PENDING
            Button(onClick = { onStatusUpdate(OrderStatus.PREPARING) }) {
                Text("开始制作")
            }
        }
        2 -> { // PREPARING
            Button(onClick = { onStatusUpdate(OrderStatus.COMPLETED) }) {
                Text("制作完成")
            }
        }
        else -> {
            // 已完成或已取消，不显示操作按钮
        }
    }
}

/**
 * 订单状态标签
 */
@Composable
private fun OrderStatusChip(statusCode: Int) {
    val (text, color) = when (statusCode) {
        0 -> "已取消" to StatusCancelled
        1 -> "待制作" to StatusPending
        2 -> "制作中" to StatusPreparing
        3 -> "制作完成" to StatusCompleted
        4 -> "配送中" to StatusPreparing
        5 -> "已完成" to StatusCompleted
        6 -> "已送达" to StatusCompleted
        else -> "未知" to Color.Gray
    }

    Surface(
        color = color.copy(alpha = 0.1f),
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
            color = color,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Medium
        )
    }
}
