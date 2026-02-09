package com.milktea.pos.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.milktea.pos.ui.theme.*

/**
 * 主屏幕 - 液态玻璃风格
 * 包含底部导航栏和页面切换
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
    val navController = rememberNavController()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(GlassBackgroundLight)
    ) {
        Scaffold(
            bottomBar = { GlassBottomNavigationBar(navController) },
            containerColor = Color.Transparent
        ) { innerPadding ->
            NavHost(
                navController = navController,
                startDestination = Screen.Order.route,
                modifier = Modifier.padding(innerPadding)
            ) {
                composable(Screen.Order.route) {
                    OrderScreen()
                }
                composable(Screen.Orders.route) {
                    OrdersScreen()
                }
                composable(Screen.MiniAppOrders.route) {
                    MiniAppOrdersScreen(
                        onBack = { navController.popBackStack() }
                    )
                }
                composable(Screen.Member.route) {
                    MemberScreen()
                }
                composable(Screen.Statistics.route) {
                    StatisticsScreen()
                }
                composable(Screen.Settings.route) {
                    SettingsScreen(navController = navController)
                }
            }
        }
    }
}

/**
 * 液态玻璃底部导航栏
 */
@Composable
private fun GlassBottomNavigationBar(navController: NavHostController) {
    val items = listOf(
        Screen.Order,
        Screen.Orders,
        Screen.Member,
        Screen.Statistics,
        Screen.Settings
    )

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    // 液态玻璃背景
    val glassBackground = Brush.verticalGradient(
        colors = listOf(
            GlassSurfaceLight.copy(alpha = 0.95f),
            GlassLight.copy(alpha = 0.85f)
        )
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(glassBackground)
            .border(
                width = 0.5.dp,
                color = GlassBorderLight,
            )
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        NavigationBar(
            containerColor = Color.Transparent,
            tonalElevation = 0.dp
        ) {
            items.forEach { screen ->
                val selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true
                NavigationBarItem(
                    icon = { 
                        Icon(
                            screen.icon, 
                            contentDescription = screen.title,
                            tint = if (selected) PrimaryColor else Gray1
                        ) 
                    },
                    label = { 
                        Text(
                            screen.title,
                            color = if (selected) PrimaryColor else Gray1
                        ) 
                    },
                    selected = selected,
                    onClick = {
                        navController.navigate(screen.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = PrimaryColor,
                        selectedTextColor = PrimaryColor,
                        unselectedIconColor = Gray1,
                        unselectedTextColor = Gray1,
                        indicatorColor = PrimaryColor.copy(alpha = 0.12f)
                    )
                )
            }
        }
    }
}

/**
 * 导航页面定义
 */
sealed class Screen(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    object Order : Screen("order", "点单", Icons.Default.PointOfSale)
    object Orders : Screen("orders", "订单", Icons.Default.ReceiptLong)
    object MiniAppOrders : Screen("miniapp_orders", "小程序订单", Icons.Default.ReceiptLong)
    object Member : Screen("member", "会员", Icons.Default.Assessment)
    object Statistics : Screen("statistics", "统计", Icons.Default.Assessment)
    object Settings : Screen("settings", "设置", Icons.Default.Settings)
}
