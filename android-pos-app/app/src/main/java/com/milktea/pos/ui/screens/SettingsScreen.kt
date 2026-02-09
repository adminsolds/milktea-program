package com.milktea.pos.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.hilt.navigation.compose.hiltViewModel
import com.milktea.pos.hardware.printer.PrinterState
import com.milktea.pos.ui.viewmodel.ConnectionStatus
import com.milktea.pos.ui.viewmodel.SettingsViewModel

/**
 * 设置页面
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    navController: NavHostController? = null,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val printerState by viewModel.printerState.collectAsState()
    val serverUrl by viewModel.serverUrl.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("设置") }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // 小程序订单入口
            SettingsSection(title = "订单管理") {
                SettingsItem(
                    icon = Icons.Default.ReceiptLong,
                    title = "小程序订单",
                    subtitle = "查看和管理小程序订单",
                    onClick = { navController?.navigate(Screen.MiniAppOrders.route) }
                )
            }

            // 打印机设置
            SettingsSection(title = "打印机设置") {
                PrinterSettingsItem(
                    printerState = printerState,
                    onConnect = viewModel::connectPrinter,
                    onDisconnect = viewModel::disconnectPrinter,
                    onTestPrint = viewModel::testPrint
                )
            }

            // 服务器设置
            val connectionStatus by viewModel.connectionStatus.collectAsState()
            SettingsSection(title = "服务器设置") {
                ServerSettingsItem(
                    serverUrl = serverUrl,
                    connectionStatus = connectionStatus,
                    onUrlChange = viewModel::updateServerUrl,
                    onTestConnection = viewModel::testServerConnection,
                    onClearStatus = viewModel::clearConnectionStatus
                )
            }

            // 其他设置
            SettingsSection(title = "其他") {
                SettingsItem(
                    icon = Icons.Default.Info,
                    title = "关于",
                    subtitle = "版本 1.0.0",
                    onClick = { /* 显示关于信息 */ }
                )

                SettingsItem(
                    icon = Icons.Default.ExitToApp,
                    title = "退出登录",
                    subtitle = "退出当前账号",
                    onClick = viewModel::logout
                )
            }
        }
    }
}

/**
 * 设置分组
 */
@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        content()
    }
}

/**
 * 设置项
 */
@Composable
private fun SettingsItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String? = null,
    trailing: @Composable (() -> Unit)? = null,
    onClick: () -> Unit
) {
    ListItem(
        headlineContent = { Text(title) },
        supportingContent = subtitle?.let { { Text(it) } },
        leadingContent = {
            Icon(icon, contentDescription = null)
        },
        trailingContent = trailing,
        modifier = Modifier.clickable(onClick = onClick)
    )
}

/**
 * 打印机设置项
 */
@Composable
private fun PrinterSettingsItem(
    printerState: PrinterState,
    onConnect: () -> Unit,
    onDisconnect: () -> Unit,
    onTestPrint: () -> Unit
) {
    val (statusText, statusColor) = when (printerState) {
        is PrinterState.Connected -> (printerState as PrinterState.Connected).info to androidx.compose.ui.graphics.Color.Green
        is PrinterState.Error -> (printerState as PrinterState.Error).message to androidx.compose.ui.graphics.Color.Red
        PrinterState.Disconnected -> "未连接" to androidx.compose.ui.graphics.Color.Gray
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "打印机状态",
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = statusText,
                    color = statusColor,
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                when (printerState) {
                    is PrinterState.Connected -> {
                        OutlinedButton(
                            onClick = onTestPrint,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("测试打印")
                        }
                        Button(
                            onClick = onDisconnect,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.error
                            )
                        ) {
                            Text("断开连接")
                        }
                    }
                    else -> {
                        Button(
                            onClick = onConnect,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("连接打印机")
                        }
                    }
                }
            }
        }
    }
}

/**
 * 服务器设置项
 */
@Composable
private fun ServerSettingsItem(
    serverUrl: String,
    connectionStatus: ConnectionStatus,
    onUrlChange: (String) -> Unit,
    onTestConnection: () -> Unit,
    onClearStatus: () -> Unit
) {
    var editingUrl by remember { mutableStateOf(serverUrl) }

    // 当 serverUrl 变化时更新编辑框
    LaunchedEffect(serverUrl) {
        editingUrl = serverUrl
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            OutlinedTextField(
                value = editingUrl,
                onValueChange = {
                    editingUrl = it
                    onClearStatus()
                },
                label = { Text("服务器地址") },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("例如: 192.168.1.100:8080") }
            )

            Spacer(modifier = Modifier.height(8.dp))

            // 显示连接状态
            when (connectionStatus) {
                is ConnectionStatus.Loading -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        Text("测试中...", style = MaterialTheme.typography.bodySmall)
                    }
                }
                is ConnectionStatus.Success -> {
                    Text(
                        text = connectionStatus.message,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                is ConnectionStatus.Error -> {
                    Text(
                        text = connectionStatus.message,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                else -> {}
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onTestConnection,
                    modifier = Modifier.weight(1f),
                    enabled = connectionStatus !is ConnectionStatus.Loading
                ) {
                    Text("测试连接")
                }
                Button(
                    onClick = { onUrlChange(editingUrl) },
                    modifier = Modifier.weight(1f),
                    enabled = connectionStatus !is ConnectionStatus.Loading
                ) {
                    Text("保存")
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "提示: 修改服务器地址后需要重启APP才能生效",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}


