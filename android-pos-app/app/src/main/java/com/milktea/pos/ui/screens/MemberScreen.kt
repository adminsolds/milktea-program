package com.milktea.pos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.milktea.pos.domain.model.Member
import com.milktea.pos.ui.theme.PrimaryColor
import com.milktea.pos.ui.viewmodel.MemberViewModel

/**
 * 会员管理页面
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemberScreen(
    viewModel: MemberViewModel = hiltViewModel()
) {
    val members by viewModel.members.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedMember by remember { mutableStateOf<Member?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("会员管理") },
                actions = {
                    IconButton(onClick = { showAddDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = "添加会员")
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
            // 搜索栏
            OutlinedTextField(
                value = searchQuery,
                onValueChange = viewModel::onSearchQueryChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("搜索会员手机号或姓名") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "搜索") },
                singleLine = true
            )

            // 会员列表
            MemberList(
                members = members,
                onMemberClick = { selectedMember = it }
            )
        }
    }

    // 添加会员弹窗
    if (showAddDialog) {
        AddMemberDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { phone, name ->
                viewModel.addMember(phone, name)
                showAddDialog = false
            }
        )
    }

    // 会员详情弹窗
    selectedMember?.let { member ->
        MemberDetailDialog(
            member = member,
            onDismiss = { selectedMember = null },
            onRecharge = { amount ->
                viewModel.rechargeMember(member.id, amount)
            }
        )
    }
}

/**
 * 会员列表
 */
@Composable
private fun MemberList(
    members: List<Member>,
    onMemberClick: (Member) -> Unit
) {
    if (members.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                "暂无会员",
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
            items(members) { member ->
                MemberCard(
                    member = member,
                    onClick = { onMemberClick(member) }
                )
            }
        }
    }
}

/**
 * 会员卡片
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MemberCard(
    member: Member,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 头像
            Surface(
                modifier = Modifier.size(56.dp),
                shape = MaterialTheme.shapes.medium,
                color = PrimaryColor.copy(alpha = 0.1f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(32.dp),
                        tint = PrimaryColor
                    )
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            // 会员信息
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = member.name ?: "未命名会员",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = member.phone,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (member.levelName != null) {
                    Text(
                        text = member.levelName,
                        style = MaterialTheme.typography.labelMedium,
                        color = PrimaryColor
                    )
                }
            }

            // 余额和积分
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "¥${String.format("%.2f", member.balance)}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryColor
                )
                Text(
                    text = "${member.points} 积分",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/**
 * 添加会员弹窗
 */
@Composable
private fun AddMemberDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, String?) -> Unit
) {
    var phone by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("添加会员") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("手机号 *") },
                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("姓名") },
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(phone, name.takeIf { it.isNotBlank() }) },
                enabled = phone.length == 11
            ) {
                Text("添加")
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
 * 会员详情弹窗
 */
@Composable
private fun MemberDetailDialog(
    member: Member,
    onDismiss: () -> Unit,
    onRecharge: (Double) -> Unit
) {
    var showRechargeDialog by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("会员详情") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 基本信息
                Card {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        InfoRow("手机号", member.phone)
                        InfoRow("姓名", member.name ?: "未设置")
                        InfoRow("会员等级", member.levelName ?: "普通会员")
                        InfoRow("折扣", "${(member.discount * 10).toInt()}折")
                    }
                }

                // 账户信息
                Card {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        InfoRow("余额", "¥${String.format("%.2f", member.balance)}", isHighlight = true)
                        InfoRow("积分", member.points.toString())
                        InfoRow("累计消费", "¥${String.format("%.2f", member.totalConsumption)}")
                        InfoRow("订单数", member.orderCount.toString())
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = { showRechargeDialog = true }) {
                Text("充值")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("关闭")
            }
        }
    )

    // 充值弹窗
    if (showRechargeDialog) {
        RechargeDialog(
            onDismiss = { showRechargeDialog = false },
            onConfirm = {
                onRecharge(it)
                showRechargeDialog = false
            }
        )
    }
}

/**
 * 信息行
 */
@Composable
private fun InfoRow(label: String, value: String, isHighlight: Boolean = false) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = if (isHighlight) {
                MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            } else {
                MaterialTheme.typography.bodyMedium
            },
            color = if (isHighlight) PrimaryColor else MaterialTheme.colorScheme.onSurface
        )
    }
}

/**
 * 充值弹窗
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun RechargeDialog(
    onDismiss: () -> Unit,
    onConfirm: (Double) -> Unit
) {
    var amount by remember { mutableStateOf("") }
    val presetAmounts = listOf(50.0, 100.0, 200.0, 500.0)

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("会员充值") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 快捷金额
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    presetAmounts.forEach { preset ->
                        FilterChip(
                            selected = amount == preset.toString(),
                            onClick = { amount = preset.toString() },
                            label = { Text("¥${preset.toInt()}") }
                        )
                    }
                }

                // 自定义金额
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("充值金额") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    prefix = { Text("¥") }
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(amount.toDoubleOrNull() ?: 0.0) },
                enabled = amount.toDoubleOrNull() != null && amount.toDouble() > 0
            ) {
                Text("确认充值")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}


