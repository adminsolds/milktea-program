package com.milktea.pos.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.milktea.pos.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)

/**
 * 液态玻璃卡片 - 苹果风格毛玻璃效果
 */
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(20.dp),
    elevation: Dp = 8.dp,
    content: @Composable ColumnScope.() -> Unit
) {
    val glassBackground = Brush.verticalGradient(
        colors = listOf(
            GlassSurfaceLight,
            GlassLight.copy(alpha = 0.40f)
        )
    )

    Box(
        modifier = modifier
            .shadow(
                elevation = elevation,
                shape = shape,
                spotColor = ShadowLight,
                ambientColor = ShadowLight
            )
            .clip(shape)
            .background(glassBackground)
            .border(
                width = 1.dp,
                color = GlassBorderLight,
                shape = shape
            )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            content = content
        )
    }
}

/**
 * 液态玻璃表面 - 用于背景容器
 */
@Composable
fun GlassSurface(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(16.dp),
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .clip(shape)
            .background(GlassSurfaceLight)
            .border(
                width = 0.5.dp,
                color = GlassBorderLight,
                shape = shape
            ),
        content = content
    )
}

/**
 * 液态玻璃按钮 - 苹果风格按钮
 */
@Composable
fun GlassButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    shape: Shape = RoundedCornerShape(12.dp),
    content: @Composable RowScope.() -> Unit
) {
    val backgroundColor = if (enabled) {
        Brush.verticalGradient(
            colors = listOf(
                PrimaryColor.copy(alpha = 0.9f),
                PrimaryColor.copy(alpha = 0.7f)
            )
        )
    } else {
        Brush.verticalGradient(
            colors = listOf(
                Gray3,
                Gray4
            )
        )
    }

    Box(
        modifier = modifier
            .shadow(
                elevation = if (enabled) 4.dp else 0.dp,
                shape = shape,
                spotColor = PrimaryColor.copy(alpha = 0.3f)
            )
            .clip(shape)
            .background(backgroundColor)
            .border(
                width = 1.dp,
                color = if (enabled) GlassBorderLight else Color.Transparent,
                shape = shape
            )
    ) {
        Button(
            onClick = onClick,
            enabled = enabled,
            colors = ButtonDefaults.buttonColors(
                containerColor = Color.Transparent,
                disabledContainerColor = Color.Transparent
            ),
            shape = shape,
            modifier = Modifier.fillMaxWidth(),
            content = content
        )
    }
}

/**
 * 液态玻璃输入框
 */
@Composable
fun GlassTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: @Composable (() -> Unit)? = null,
    placeholder: @Composable (() -> Unit)? = null,
    leadingIcon: @Composable (() -> Unit)? = null,
    trailingIcon: @Composable (() -> Unit)? = null,
    singleLine: Boolean = true,
    shape: Shape = RoundedCornerShape(12.dp)
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        label = label,
        placeholder = placeholder,
        leadingIcon = leadingIcon,
        trailingIcon = trailingIcon,
        singleLine = singleLine,
        shape = shape,
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = GlassSurfaceLight,
            unfocusedContainerColor = GlassLight.copy(alpha = 0.30f),
            focusedBorderColor = PrimaryColor.copy(alpha = 0.6f),
            unfocusedBorderColor = GlassBorderLight,
            focusedLabelColor = PrimaryColor,
            unfocusedLabelColor = Gray1
        )
    )
}

/**
 * 液态玻璃顶部栏
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GlassTopBar(
    title: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    navigationIcon: @Composable (() -> Unit)? = null,
    actions: @Composable (RowScope.() -> Unit) = {}
) {
    val backgroundBrush = Brush.verticalGradient(
        colors = listOf(
            GlassLight.copy(alpha = 0.85f),
            GlassSurfaceLight.copy(alpha = 0.75f)
        )
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(backgroundBrush)
            .border(
                width = 0.5.dp,
                color = GlassBorderLight,
            )
    ) {
        if (navigationIcon != null) {
            TopAppBar(
                title = title,
                navigationIcon = navigationIcon,
                actions = actions,
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent,
                    titleContentColor = GlassTextPrimaryLight,
                    navigationIconContentColor = GlassTextPrimaryLight,
                    actionIconContentColor = GlassTextPrimaryLight
                )
            )
        } else {
            TopAppBar(
                title = title,
                actions = actions,
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent,
                    titleContentColor = GlassTextPrimaryLight,
                    navigationIconContentColor = GlassTextPrimaryLight,
                    actionIconContentColor = GlassTextPrimaryLight
                )
            )
        }
    }
}

/**
 * 液态玻璃底部导航栏
 */
@Composable
fun GlassBottomNavigation(
    selectedItem: Int,
    onItemSelected: (Int) -> Unit,
    items: List<GlassNavItem>,
    modifier: Modifier = Modifier
) {
    val backgroundBrush = Brush.verticalGradient(
        colors = listOf(
            GlassSurfaceLight.copy(alpha = 0.90f),
            GlassLight.copy(alpha = 0.80f)
        )
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(backgroundBrush)
            .border(
                width = 0.5.dp,
                color = GlassBorderLight,
            )
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        NavigationBar(
            containerColor = Color.Transparent,
            tonalElevation = 0.dp
        ) {
            items.forEachIndexed { index, item ->
                NavigationBarItem(
                    icon = { Icon(item.icon, contentDescription = item.label) },
                    label = { Text(item.label) },
                    selected = selectedItem == index,
                    onClick = { onItemSelected(index) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = PrimaryColor,
                        selectedTextColor = PrimaryColor,
                        unselectedIconColor = Gray1,
                        unselectedTextColor = Gray1,
                        indicatorColor = PrimaryColor.copy(alpha = 0.15f)
                    )
                )
            }
        }
    }
}

/**
 * 导航项数据类
 */
data class GlassNavItem(
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)

/**
 * 液态玻璃标签页
 */
@Composable
fun GlassTabRow(
    selectedTabIndex: Int,
    onTabSelected: (Int) -> Unit,
    tabs: List<String>,
    modifier: Modifier = Modifier
) {
    val shape = RoundedCornerShape(10.dp)

    Box(
        modifier = modifier
            .clip(shape)
            .background(Gray6)
            .padding(4.dp)
    ) {
        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = Color.Transparent,
            contentColor = PrimaryColor,
            indicator = { },
            divider = { }
        ) {
            tabs.forEachIndexed { index, title ->
                val isSelected = selectedTabIndex == index
                Tab(
                    selected = isSelected,
                    onClick = { onTabSelected(index) },
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            if (isSelected) GlassLight.copy(alpha = 0.90f)
                            else Color.Transparent
                        )
                ) {
                    Text(
                        text = title,
                        modifier = Modifier.padding(vertical = 10.dp, horizontal = 16.dp),
                        color = if (isSelected) PrimaryColor else Gray1,
                        style = MaterialTheme.typography.labelLarge
                    )
                }
            }
        }
    }
}

/**
 * 液态玻璃浮动操作按钮
 */
@Composable
fun GlassFloatingActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val backgroundBrush = Brush.radialGradient(
        colors = listOf(
            PrimaryColor.copy(alpha = 0.95f),
            PrimaryColor.copy(alpha = 0.75f)
        )
    )

    Box(
        modifier = modifier
            .shadow(
                elevation = 8.dp,
                shape = RoundedCornerShape(16.dp),
                spotColor = PrimaryColor.copy(alpha = 0.4f)
            )
            .clip(RoundedCornerShape(16.dp))
            .background(backgroundBrush)
            .border(
                width = 1.dp,
                color = GlassBorderLight,
                shape = RoundedCornerShape(16.dp)
            )
    ) {
        FloatingActionButton(
            onClick = onClick,
            containerColor = Color.Transparent,
            contentColor = Color.White,
            shape = RoundedCornerShape(16.dp),
            content = content
        )
    }
}

/**
 * 液态玻璃列表项
 */
@Composable
fun GlassListItem(
    headlineContent: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    overlineContent: @Composable (() -> Unit)? = null,
    supportingContent: @Composable (() -> Unit)? = null,
    leadingContent: @Composable (() -> Unit)? = null,
    trailingContent: @Composable (() -> Unit)? = null,
    onClick: (() -> Unit)? = null
) {
    val shape = RoundedCornerShape(12.dp)

    Box(
        modifier = modifier
            .clip(shape)
            .background(GlassSurfaceLight)
            .border(
                width = 0.5.dp,
                color = GlassBorderLight,
                shape = shape
            )
    ) {
        ListItem(
            headlineContent = headlineContent,
            overlineContent = overlineContent,
            supportingContent = supportingContent,
            leadingContent = leadingContent,
            trailingContent = trailingContent,
            modifier = Modifier.fillMaxWidth(),
            colors = ListItemDefaults.colors(
                containerColor = Color.Transparent
            )
        )
    }
}

/**
 * 液态玻璃徽章
 */
@Composable
fun GlassBadge(
    content: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    containerColor: Color = iOSRed.copy(alpha = 0.9f)
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(containerColor)
            .border(
                width = 0.5.dp,
                color = GlassBorderLight,
                shape = RoundedCornerShape(10.dp)
            )
            .padding(horizontal = 8.dp, vertical = 2.dp)
    ) {
        content()
    }
}

/**
 * 液态玻璃分割线
 */
@Composable
fun GlassDivider(
    modifier: Modifier = Modifier,
    color: Color = GlassBorderLight
) {
    Divider(
        modifier = modifier,
        color = color,
        thickness = 0.5.dp
    )
}

/**
 * 液态玻璃芯片
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GlassFilterChip(
    selected: Boolean,
    onClick: () -> Unit,
    label: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    leadingIcon: @Composable (() -> Unit)? = null
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { label() },
        leadingIcon = leadingIcon,
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = PrimaryColor.copy(alpha = 0.15f),
            selectedLabelColor = PrimaryColor,
            containerColor = GlassSurfaceLight,
            labelColor = Gray1
        ),
        border = FilterChipDefaults.filterChipBorder(
            borderColor = GlassBorderLight,
            selectedBorderColor = PrimaryColor.copy(alpha = 0.3f),
            borderWidth = 0.5.dp
        )
    )
}
