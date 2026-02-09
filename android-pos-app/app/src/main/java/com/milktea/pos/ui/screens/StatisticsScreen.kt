package com.milktea.pos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.milktea.pos.ui.theme.PrimaryColor
import com.milktea.pos.ui.theme.SuccessColor
import com.milktea.pos.ui.theme.WarningColor
import com.milktea.pos.ui.viewmodel.StatisticsViewModel
import com.milktea.pos.ui.viewmodel.TodayStatistics
import com.milktea.pos.ui.viewmodel.ProductStatistic

/**
 * 统计页面
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatisticsScreen(
    viewModel: StatisticsViewModel = hiltViewModel()
) {
    val todayStats by viewModel.todayStats.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("数据统计") },
                actions = {
                    IconButton(onClick = viewModel::refreshStatistics) {
                        Icon(Icons.Default.Refresh, contentDescription = "刷新")
                    }
                }
            )
        }
    ) { paddingValues ->
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 今日概览
                item {
                    TodayOverviewCard(stats = todayStats)
                }

                // 订单统计
                item {
                    OrderStatisticsCard(stats = todayStats)
                }

                // 支付方式统计
                item {
                    PaymentMethodCard(stats = todayStats)
                }

                // 热销商品
                item {
                    TopProductsCard(products = todayStats.topProducts)
                }
            }
        }
    }
}

/**
 * 今日概览卡片
 */
@Composable
private fun TodayOverviewCard(stats: TodayStatistics) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "今日概览",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatisticItem(
                    icon = Icons.Default.AttachMoney,
                    value = "¥${String.format("%.2f", stats.revenue)}",
                    label = "营业额",
                    color = SuccessColor
                )

                StatisticItem(
                    icon = Icons.Default.Receipt,
                    value = stats.orderCount.toString(),
                    label = "订单数",
                    color = PrimaryColor
                )

                StatisticItem(
                    icon = Icons.Default.TrendingUp,
                    value = "¥${String.format("%.2f", stats.averageOrderValue)}",
                    label = "客单价",
                    color = WarningColor
                )
            }
        }
    }
}

/**
 * 统计项
 */
@Composable
private fun StatisticItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    value: String,
    label: String,
    color: androidx.compose.ui.graphics.Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            shape = MaterialTheme.shapes.medium,
            color = color.copy(alpha = 0.1f),
            modifier = Modifier.size(56.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(28.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = color
        )

        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * 订单统计卡片
 */
@Composable
private fun OrderStatisticsCard(stats: TodayStatistics) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "订单统计",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                OrderTypeItem(
                    title = "堂食",
                    count = stats.dineInCount,
                    amount = stats.dineInAmount
                )
                OrderTypeItem(
                    title = "自取",
                    count = stats.takeoutCount,
                    amount = stats.takeoutAmount
                )
                OrderTypeItem(
                    title = "外卖",
                    count = stats.deliveryCount,
                    amount = stats.deliveryAmount
                )
            }
        }
    }
}

/**
 * 订单类型项
 */
@Composable
private fun OrderTypeItem(title: String, count: Int, amount: Double) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = "$count 单",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = "¥${String.format("%.2f", amount)}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * 支付方式卡片
 */
@Composable
private fun PaymentMethodCard(stats: TodayStatistics) {
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
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            stats.paymentStats.forEach { payment ->
                PaymentMethodItem(
                    method = payment.method,
                    count = payment.count,
                    amount = payment.amount,
                    totalAmount = stats.revenue
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

/**
 * 支付方式项
 */
@Composable
private fun PaymentMethodItem(
    method: String,
    count: Int,
    amount: Double,
    totalAmount: Double
) {
    val percentage = if (totalAmount > 0) (amount / totalAmount * 100).toInt() else 0
    val methodName = when (method) {
        "CASH" -> "现金"
        "WECHAT" -> "微信支付"
        "ALIPAY" -> "支付宝"
        "WALLET" -> "储值支付"
        else -> method
    }

    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = methodName,
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = "$count 单 · ¥${String.format("%.2f", amount)}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        LinearProgressIndicator(
            progress = percentage / 100f,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

/**
 * 热销商品卡片
 */
@Composable
private fun TopProductsCard(products: List<ProductStatistic>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "热销商品 TOP5",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            products.take(5).forEachIndexed { index, product ->
                TopProductItem(
                    rank = index + 1,
                    name = product.name,
                    quantity = product.quantity,
                    revenue = product.revenue
                )
                if (index < products.size - 1 && index < 4) {
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                }
            }
        }
    }
}

/**
 * 热销商品项
 */
@Composable
private fun TopProductItem(
    rank: Int,
    name: String,
    quantity: Int,
    revenue: Double
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // 排名
            Surface(
                shape = MaterialTheme.shapes.small,
                color = when (rank) {
                    1 -> WarningColor
                    2 -> PrimaryColor
                    3 -> SuccessColor
                    else -> MaterialTheme.colorScheme.surfaceVariant
                },
                modifier = Modifier.size(28.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = rank.toString(),
                        style = MaterialTheme.typography.labelMedium,
                        color = if (rank <= 3) androidx.compose.ui.graphics.Color.White 
                                else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Text(
                text = name,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = "$quantity 杯",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = "¥${String.format("%.2f", revenue)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// 数据类已移至 StatisticsViewModel.kt


