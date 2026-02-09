package com.milktea.pos.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * 购物车徽章按钮
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartBadge(
    itemCount: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier) {
        IconButton(onClick = onClick) {
            Icon(
                imageVector = Icons.Default.ShoppingCart,
                contentDescription = "购物车"
            )
        }

        if (itemCount > 0) {
            Badge(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(4.dp)
            ) {
                Text(
                    text = if (itemCount > 99) "99+" else itemCount.toString(),
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}
