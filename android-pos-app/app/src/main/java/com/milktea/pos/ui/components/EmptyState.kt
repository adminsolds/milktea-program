package com.milktea.pos.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

/**
 * 空状态组件
 */
@Composable
fun EmptyState(
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Default.Inbox,
    title: String = "暂无数据",
    message: String? = null,
    action: @Composable (() -> Unit)? = null
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        if (message != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
        }

        if (action != null) {
            Spacer(modifier = Modifier.height(16.dp))
            action()
        }
    }
}

/**
 * 错误状态组件
 */
@Composable
fun ErrorState(
    modifier: Modifier = Modifier,
    message: String = "加载失败",
    onRetry: () -> Unit
) {
    EmptyState(
        modifier = modifier,
        icon = Icons.Default.ErrorOutline,
        title = "出错了",
        message = message,
        action = {
            Button(onClick = onRetry) {
                Text("重试")
            }
        }
    )
}
