package com.milktea.pos.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items as gridItems
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.milktea.pos.domain.model.*
import com.milktea.pos.ui.components.*
import com.milktea.pos.ui.theme.*
import com.milktea.pos.ui.viewmodel.CheckoutViewModel
import com.milktea.pos.ui.viewmodel.OrderViewModel
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.milktea.pos.hardware.printer.MeituanPrinterManager
import kotlinx.coroutines.launch
import timber.log.Timber

/**
 * 点单页面 - 左右分栏布局
 * 左侧：商品列表（分类 + 商品网格）
 * 右侧：购物车
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun OrderScreen(
    viewModel: OrderViewModel = hiltViewModel(),
    checkoutViewModel: CheckoutViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val cartItems by viewModel.cartItems.collectAsState()
    val categories by viewModel.categories.collectAsState()
    val products by viewModel.products.collectAsState()
    val selectedCategory by viewModel.selectedCategory.collectAsState()

    var showProductDetail by remember { mutableStateOf<Product?>(null) }
    var showCheckoutDialog by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(GlassBackgroundLight)
    ) {
        Scaffold(
            topBar = {
                GlassTopBar(
                    title = { 
                        Text(
                            "现场点单",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.SemiBold
                            )
                        ) 
                    }
                )
            },
            containerColor = Color.Transparent
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
            when {
                uiState.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                uiState.error != null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "加载失败: ${uiState.error}",
                            color = MaterialTheme.colorScheme.error
                        )
                        Button(
                            onClick = { viewModel.refresh() },
                            modifier = Modifier.padding(top = 16.dp)
                        ) {
                            Text("重试")
                        }
                    }
                }
                else -> {
                    // 左右分栏布局
                    Row(
                        modifier = Modifier.fillMaxSize()
                    ) {
                        // 左侧：商品列表区域（占 65%）
                        Column(
                            modifier = Modifier
                                .weight(0.65f)
                                .fillMaxHeight()
                        ) {
                            // 分类横向滚动栏
                            CategoryTabs(
                                categories = categories,
                                selectedCategory = selectedCategory,
                                onCategorySelected = viewModel::selectCategory,
                                modifier = Modifier.fillMaxWidth()
                            )

                            // 商品网格
                            ProductGrid(
                                products = products,
                                onProductClick = { showProductDetail = it },
                                modifier = Modifier.weight(1f)
                            )
                        }

                        // 右侧：购物车区域（占 35%）
                        ShoppingCartPanel(
                            cartItems = cartItems,
                            onUpdateQuantity = viewModel::updateQuantity,
                            onRemoveItem = viewModel::removeFromCart,
                            onClearCart = viewModel::clearCart,
                            onCheckout = { showCheckoutDialog = true },
                            modifier = Modifier
                                .weight(0.35f)
                                .fillMaxHeight()
                        )
                    }
                }
            }
        }
    }
    }

    // 商品详情弹窗
    showProductDetail?.let { product ->
        ProductDetailDialog(
            product = product,
            onDismiss = { showProductDetail = null },
            onAddToCart = { item ->
                viewModel.addToCart(item)
                showProductDetail = null
            }
        )
    }

    // 结算弹窗
    if (showCheckoutDialog) {
        val scope = rememberCoroutineScope()
        val context = androidx.compose.ui.platform.LocalContext.current

        CheckoutDialog(
            cartItems = cartItems,
            checkoutViewModel = checkoutViewModel,
            onDismiss = { showCheckoutDialog = false },
            onCheckoutComplete = { order ->
                viewModel.clearCart()
                checkoutViewModel.clearMember()
                showCheckoutDialog = false

                // 打印小票和标签（优先USB，失败时尝试网络打印）
                scope.launch {
                    try {
                        val printerManager = MeituanPrinterManager(context)
                        var printSuccess = false

                        // 第一步：尝试USB连接打印
                        if (printerManager.autoConnect()) {
                            Timber.d("USB打印机已连接")

                            // 打印小票
                            val receiptResult = printerManager.printReceipt(order)
                            if (receiptResult.isSuccess) {
                                Timber.d("USB小票打印成功")
                                printSuccess = true

                                // 打印标签
                                order.items.forEachIndexed { index, item ->
                                    val labelResult = printerManager.printLabel(order, item, index + 1, order.items.size)
                                    if (labelResult.isSuccess) {
                                        Timber.d("USB标签打印成功: ${item.productName}")
                                    } else {
                                        Timber.e("USB标签打印失败: ${item.productName}")
                                    }
                                }
                            } else {
                                Timber.e("USB小票打印失败: ${receiptResult.exceptionOrNull()?.message}")
                            }
                        } else {
                            Timber.w("USB打印机未连接")
                        }

                        // 第二步：如果USB打印失败，尝试网络打印（备用方案）
                        if (!printSuccess) {
                            Timber.d("尝试使用网络打印机（备用方案）")
                            // TODO: 从设置中读取网络打印机IP
                            val networkPrinterIp = "192.168.1.100" // 默认网络打印机IP
                            val networkResult = printerManager.connectNetworkPrinter(networkPrinterIp, 9100)

                            if (networkResult.isSuccess) {
                                Timber.d("网络打印机已连接: $networkPrinterIp")

                                // 打印小票
                                val receiptResult = printerManager.printReceipt(order)
                                if (receiptResult.isSuccess) {
                                    Timber.d("网络小票打印成功")

                                    // 打印标签
                                    order.items.forEachIndexed { index, item ->
                                        val labelResult = printerManager.printLabel(order, item, index + 1, order.items.size)
                                        if (labelResult.isSuccess) {
                                            Timber.d("网络标签打印成功: ${item.productName}")
                                        } else {
                                            Timber.e("网络标签打印失败: ${item.productName}")
                                        }
                                    }
                                } else {
                                    Timber.e("网络小票打印失败: ${receiptResult.exceptionOrNull()?.message}")
                                }
                            } else {
                                Timber.e("网络打印机连接失败: ${networkResult.exceptionOrNull()?.message}")
                            }
                        }

                        printerManager.release()
                    } catch (e: Exception) {
                        Timber.e(e, "打印失败")
                    }
                }
            }
        )
    }
}

/**
 * 分类标签栏 - 横向滚动（液态玻璃风格）
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CategoryTabs(
    categories: List<Category>,
    selectedCategory: Int?,
    onCategorySelected: (Int?) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // 全部选项
            GlassFilterChip(
                selected = selectedCategory == null,
                onClick = { onCategorySelected(null) },
                label = { Text("全部") }
            )

            // 分类列表
            categories.forEach { category ->
                GlassFilterChip(
                    selected = selectedCategory == category.id,
                    onClick = { onCategorySelected(category.id) },
                    label = { Text(category.name) }
                )
            }
        }
    }
}

/**
 * 商品网格
 */
@Composable
private fun ProductGrid(
    products: List<Product>,
    onProductClick: (Product) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 140.dp),
        modifier = modifier.padding(8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        gridItems(products) { product ->
            ProductCard(
                product = product,
                onClick = { onProductClick(product) }
            )
        }
    }
}

/**
 * 商品卡片 - 液态玻璃风格
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductCard(
    product: Product,
    onClick: () -> Unit
) {
    val glassBackground = Brush.verticalGradient(
        colors = listOf(
            GlassSurfaceLight,
            GlassLight.copy(alpha = 0.40f)
        )
    )

    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 4.dp,
                shape = RoundedCornerShape(16.dp),
                spotColor = ShadowLight
            ),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.Transparent
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Box(
            modifier = Modifier.background(glassBackground)
        ) {
            Column {
                // 商品图片
                AsyncImage(
                    model = product.image,
                    contentDescription = product.name,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp)
                        .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)),
                    contentScale = ContentScale.Crop
                )

                // 商品信息
                Column(
                    modifier = Modifier.padding(12.dp)
                ) {
                    Text(
                        text = product.name,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        color = GlassTextPrimaryLight
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "¥${String.format("%.2f", product.price)}",
                        style = MaterialTheme.typography.bodyLarge,
                        color = PrimaryColor,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

/**
 * 购物车面板 - 液态玻璃风格
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ShoppingCartPanel(
    cartItems: List<CartItem>,
    onUpdateQuantity: (CartItem, Int) -> Unit,
    onRemoveItem: (CartItem) -> Unit,
    onClearCart: () -> Unit,
    onCheckout: () -> Unit,
    modifier: Modifier = Modifier
) {
    val totalPrice = cartItems.sumOf { it.totalPrice }
    val totalCount = cartItems.sumOf { it.quantity }

    val glassBackground = Brush.verticalGradient(
        colors = listOf(
            GlassSurfaceLight.copy(alpha = 0.80f),
            GlassLight.copy(alpha = 0.50f)
        )
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(glassBackground)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // 购物车标题栏 - 液态玻璃风格
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                PrimaryColor.copy(alpha = 0.95f),
                                PrimaryColor.copy(alpha = 0.85f)
                            )
                        )
                    )
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.ShoppingCart,
                            contentDescription = null,
                            tint = Color.White
                        )
                        Text(
                            text = "购物车",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold
                        )
                        if (totalCount > 0) {
                            GlassBadge(
                                content = {
                                    Text(
                                        text = totalCount.toString(),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color.White
                                    )
                                },
                                containerColor = iOSRed
                            )
                        }
                    }

                    if (cartItems.isNotEmpty()) {
                        TextButton(
                            onClick = onClearCart,
                            colors = ButtonDefaults.textButtonColors(
                                contentColor = Color.White.copy(alpha = 0.9f)
                            )
                        ) {
                            Text("清空")
                        }
                    }
                }
            }

            // 购物车商品列表
            if (cartItems.isEmpty()) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.ShoppingCart,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = Gray2
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "购物车是空的",
                            color = Gray1,
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Text(
                            "点击左侧商品添加",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Gray2
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(cartItems) { item ->
                        CartItemCard(
                            item = item,
                            onUpdateQuantity = { onUpdateQuantity(item, it) },
                            onRemove = { onRemoveItem(item) }
                        )
                    }
                }
            }

            // 底部结算栏 - 液态玻璃风格
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                GlassLight.copy(alpha = 0.95f),
                                GlassSurfaceLight.copy(alpha = 0.90f)
                            )
                        )
                    )
                    .border(
                        width = 0.5.dp,
                        color = GlassBorderLight,
                    )
                    .padding(16.dp)
            ) {
                Column {
                    // 金额信息
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "共 $totalCount 件",
                            style = MaterialTheme.typography.bodyMedium,
                            color = GlassTextSecondaryLight
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "合计: ",
                                style = MaterialTheme.typography.bodyLarge,
                                color = GlassTextSecondaryLight
                            )
                            Text(
                                text = "¥${String.format("%.2f", totalPrice)}",
                                style = MaterialTheme.typography.headlineSmall,
                                color = PrimaryColor,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // 结算按钮 - 液态玻璃风格
                    val buttonBrush = Brush.verticalGradient(
                        colors = if (cartItems.isNotEmpty()) {
                            listOf(
                                PrimaryColor.copy(alpha = 0.95f),
                                PrimaryColor.copy(alpha = 0.85f)
                            )
                        } else {
                            listOf(Gray3, Gray4)
                        }
                    )

                    Button(
                        onClick = onCheckout,
                        modifier = Modifier
                            .fillMaxWidth()
                            .shadow(
                                elevation = if (cartItems.isNotEmpty()) 4.dp else 0.dp,
                                shape = RoundedCornerShape(12.dp),
                                spotColor = PrimaryColor.copy(alpha = 0.3f)
                            ),
                        enabled = cartItems.isNotEmpty(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent,
                            disabledContainerColor = Color.Transparent
                        )
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(buttonBrush)
                                .padding(vertical = 4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "去结算",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * 购物车商品卡片 - 液态玻璃风格
 */
@Composable
private fun CartItemCard(
    item: CartItem,
    onUpdateQuantity: (Int) -> Unit,
    onRemove: () -> Unit
) {
    val glassBackground = Brush.verticalGradient(
        colors = listOf(
            GlassLight.copy(alpha = 0.70f),
            GlassSurfaceLight.copy(alpha = 0.50f)
        )
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(
                elevation = 2.dp,
                shape = RoundedCornerShape(12.dp),
                spotColor = ShadowLight
            )
            .clip(RoundedCornerShape(12.dp))
            .background(glassBackground)
            .border(
                width = 0.5.dp,
                color = GlassBorderLight,
                shape = RoundedCornerShape(12.dp)
            )
            .padding(12.dp)
    ) {
        Column {
            // 商品名称和删除按钮
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = item.product.name + (item.size?.name?.let { "($it)" } ?: ""),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.weight(1f),
                    color = GlassTextPrimaryLight
                )
                IconButton(
                    onClick = onRemove,
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "删除",
                        tint = iOSRed,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            // 定制选项
            val options = mutableListOf<String>()
            options.add(item.sugar)
            options.add(item.ice)
            options.addAll(item.toppings.map { it.name })

            Text(
                text = options.joinToString(" / "),
                style = MaterialTheme.typography.bodySmall,
                color = GlassTextSecondaryLight
            )

            Spacer(modifier = Modifier.height(8.dp))

            // 数量控制和价格
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 数量控制
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    IconButton(
                        onClick = { onUpdateQuantity(item.quantity - 1) },
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(Gray6),
                        enabled = item.quantity > 1
                    ) {
                        Icon(
                            Icons.Default.Remove,
                            contentDescription = "减少",
                            modifier = Modifier.size(16.dp),
                            tint = if (item.quantity > 1) PrimaryColor else Gray2
                        )
                    }

                    Text(
                        text = item.quantity.toString(),
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.width(24.dp),
                        textAlign = TextAlign.Center,
                        color = GlassTextPrimaryLight
                    )

                    IconButton(
                        onClick = { onUpdateQuantity(item.quantity + 1) },
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(Gray6)
                    ) {
                        Icon(
                            Icons.Default.Add,
                            contentDescription = "增加",
                            modifier = Modifier.size(16.dp),
                            tint = PrimaryColor
                        )
                    }
                }

                // 价格
                Text(
                    text = "¥${String.format("%.2f", item.totalPrice)}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryColor
                )
            }
        }
    }
}

/**
 * 商品详情弹窗
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun ProductDetailDialog(
    product: Product,
    onDismiss: () -> Unit,
    onAddToCart: (CartItem) -> Unit
) {
    var quantity by remember { mutableIntStateOf(1) }
    var selectedSize by remember { mutableStateOf(product.sizes?.firstOrNull()) }
    var selectedSugar by remember { mutableStateOf("标准糖") }
    var selectedIce by remember { mutableStateOf("正常冰") }
    val selectedToppings = remember { mutableStateListOf<Topping>() }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(product.name) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 尺寸选择
                if (!product.sizes.isNullOrEmpty()) {
                    Text("尺寸", style = MaterialTheme.typography.titleSmall)
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        product.sizes.forEach { size ->
                            FilterChip(
                                selected = selectedSize?.name == size.name,
                                onClick = { selectedSize = size },
                                label = { Text("${size.name} ¥${size.price}") }
                            )
                        }
                    }
                }

                // 糖度选择
                Text("糖度", style = MaterialTheme.typography.titleSmall)
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("无糖", "微糖", "半糖", "少糖", "标准糖", "全糖").forEach { sugar ->
                        FilterChip(
                            selected = selectedSugar == sugar,
                            onClick = { selectedSugar = sugar },
                            label = { Text(sugar) }
                        )
                    }
                }

                // 冰度选择
                Text("冰度", style = MaterialTheme.typography.titleSmall)
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("热", "温", "去冰", "少冰", "正常冰", "多冰").forEach { ice ->
                        FilterChip(
                            selected = selectedIce == ice,
                            onClick = { selectedIce = ice },
                            label = { Text(ice) }
                        )
                    }
                }

                // 配料选择
                if (!product.toppings.isNullOrEmpty()) {
                    Text("加料", style = MaterialTheme.typography.titleSmall)
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        product.toppings.forEach { topping ->
                            val isSelected = selectedToppings.contains(topping)
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    if (isSelected) {
                                        selectedToppings.remove(topping)
                                    } else {
                                        selectedToppings.add(topping)
                                    }
                                },
                                label = { Text("${topping.name} +¥${topping.price}") }
                            )
                        }
                    }
                }

                // 数量选择
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("数量", style = MaterialTheme.typography.titleSmall)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        IconButton(
                            onClick = { if (quantity > 1) quantity-- },
                            enabled = quantity > 1
                        ) {
                            Icon(Icons.Default.Remove, contentDescription = "减少")
                        }
                        Text(
                            text = quantity.toString(),
                            style = MaterialTheme.typography.titleLarge
                        )
                        IconButton(onClick = { quantity++ }) {
                            Icon(Icons.Default.Add, contentDescription = "增加")
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val cartItem = CartItem(
                        product = product,
                        quantity = quantity,
                        size = selectedSize,
                        sugar = selectedSugar,
                        ice = selectedIce,
                        toppings = selectedToppings.toList()
                    )
                    onAddToCart(cartItem)
                }
            ) {
                Text("加入购物车")
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
 * 结算弹窗
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun CheckoutDialog(
    cartItems: List<CartItem>,
    checkoutViewModel: CheckoutViewModel,
    onDismiss: () -> Unit,
    onCheckoutComplete: (Order) -> Unit
) {
    val member by checkoutViewModel.member.collectAsState()
    val uiState by checkoutViewModel.uiState.collectAsState()
    var selectedPayment by remember { mutableStateOf(PaymentMethod.CASH) }
    var remark by remember { mutableStateOf("") }
    var showMemberQuery by remember { mutableStateOf(false) }
    var memberPhone by remember { mutableStateOf("") }

    val totalAmount = cartItems.sumOf { it.totalPrice }
    val memberDiscount = member?.let { m ->
        if (m.discount < 1.0) totalAmount * (1 - m.discount) else 0.0
    } ?: 0.0
    val finalAmount = totalAmount - memberDiscount

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("订单结算", style = MaterialTheme.typography.titleLarge) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 500.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 商品列表摘要
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            "商品明细 (${cartItems.size}件)",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        cartItems.take(3).forEach { item ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    item.product.name + " x${item.quantity}",
                                    style = MaterialTheme.typography.bodySmall,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    "¥${String.format("%.2f", item.totalPrice)}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                        if (cartItems.size > 3) {
                            Text(
                                "...还有 ${cartItems.size - 3} 件商品",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                // 会员信息
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        member?.let { m ->
                            Column {
                                Text(
                                    m.name ?: "会员",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    "${m.phone} | 余额: ¥${String.format("%.2f", m.balance)}",
                                    style = MaterialTheme.typography.bodySmall
                                )
                                if (m.discount < 1.0) {
                                    Text(
                                        "会员折扣: ${(m.discount * 10).toInt()}折",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = SuccessColor
                                    )
                                }
                            }
                            TextButton(onClick = { checkoutViewModel.clearMember() }) {
                                Text("清除")
                            }
                        } ?: run {
                            Text("散客订单", style = MaterialTheme.typography.bodyMedium)
                            Button(onClick = { showMemberQuery = true }) {
                                Icon(Icons.Default.PersonSearch, contentDescription = null)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("查询会员")
                            }
                        }
                    }
                }

                // 支付方式
                Text("支付方式", style = MaterialTheme.typography.titleSmall)
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    PaymentMethodChip(
                        method = PaymentMethod.CASH,
                        isSelected = selectedPayment == PaymentMethod.CASH,
                        onClick = { selectedPayment = PaymentMethod.CASH }
                    )
                    PaymentMethodChip(
                        method = PaymentMethod.WECHAT,
                        isSelected = selectedPayment == PaymentMethod.WECHAT,
                        onClick = { selectedPayment = PaymentMethod.WECHAT }
                    )
                    PaymentMethodChip(
                        method = PaymentMethod.ALIPAY,
                        isSelected = selectedPayment == PaymentMethod.ALIPAY,
                        onClick = { selectedPayment = PaymentMethod.ALIPAY }
                    )
                    member?.let { m ->
                        if (m.balance >= finalAmount) {
                            PaymentMethodChip(
                                method = PaymentMethod.WALLET,
                                isSelected = selectedPayment == PaymentMethod.WALLET,
                                onClick = { selectedPayment = PaymentMethod.WALLET }
                            )
                        }
                    }
                }

                // 备注
                OutlinedTextField(
                    value = remark,
                    onValueChange = { remark = it },
                    label = { Text("订单备注") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // 金额汇总
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.secondaryContainer
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("商品金额", style = MaterialTheme.typography.bodyMedium)
                            Text("¥${String.format("%.2f", totalAmount)}")
                        }
                        if (memberDiscount > 0) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("会员优惠", style = MaterialTheme.typography.bodyMedium, color = SuccessColor)
                                Text("-¥${String.format("%.2f", memberDiscount)}", color = SuccessColor)
                            }
                        }
                        Divider(modifier = Modifier.padding(vertical = 4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("实付金额", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(
                                "¥${String.format("%.2f", finalAmount)}",
                                style = MaterialTheme.typography.headlineSmall,
                                color = PrimaryColor,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // 错误提示
                uiState.error?.let { error ->
                    Text(
                        error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    checkoutViewModel.checkout(
                        cartItems = cartItems,
                        paymentMethod = selectedPayment,
                        remark = remark,
                        onSuccess = onCheckoutComplete,
                        onError = { error ->
                            // 错误已在 uiState 中显示
                        }
                    )
                },
                enabled = !uiState.isLoading && finalAmount > 0
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("确认支付")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )

    // 查询会员弹窗
    if (showMemberQuery) {
        AlertDialog(
            onDismissRequest = { showMemberQuery = false },
            title = { Text("查询会员") },
            text = {
                OutlinedTextField(
                    value = memberPhone,
                    onValueChange = { memberPhone = it },
                    label = { Text("请输入手机号") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        checkoutViewModel.queryMember(memberPhone)
                        showMemberQuery = false
                        memberPhone = ""
                    },
                    enabled = memberPhone.isNotBlank()
                ) {
                    Text("查询")
                }
            },
            dismissButton = {
                TextButton(onClick = { showMemberQuery = false }) {
                    Text("取消")
                }
            }
        )
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
        label = { Text(label) },
        leadingIcon = {
            Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp))
        }
    )
}
