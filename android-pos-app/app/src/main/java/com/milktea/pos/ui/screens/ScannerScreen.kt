package com.milktea.pos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.journeyapps.barcodescanner.CaptureManager
import com.journeyapps.barcodescanner.CompoundBarcodeView

/**
 * 扫码页面
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScannerScreen(
    onScanResult: (String) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var scanResult by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("扫码") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // 扫码预览
            BarcodeScannerView(
                onScanResult = { result ->
                    scanResult = result
                    onScanResult(result)
                }
            )

            // 扫码提示
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 100.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Surface(
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text(
                        text = "将二维码/条码放入框内",
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 12.dp),
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }

            // 手动输入按钮
            FloatingActionButton(
                onClick = { /* 打开手动输入 */ },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp)
            ) {
                Icon(Icons.Default.Keyboard, contentDescription = "手动输入")
            }
        }
    }
}

/**
 * 条码扫描视图
 */
@Composable
private fun BarcodeScannerView(
    onScanResult: (String) -> Unit
) {
    val context = LocalContext.current
    var captureManager: CaptureManager? = remember { null }

    AndroidView(
        factory = { ctx ->
            CompoundBarcodeView(ctx).apply {
                captureManager = CaptureManager(context as android.app.Activity, this)
                captureManager?.initializeFromIntent((context as android.app.Activity).intent, null)
                captureManager?.onResume()

                decodeContinuous { result ->
                    result.text?.let { onScanResult(it) }
                }
            }
        },
        modifier = Modifier.fillMaxSize()
    )

    DisposableEffect(Unit) {
        onDispose {
            captureManager?.onPause()
            captureManager?.onDestroy()
        }
    }
}

/**
 * 手动输入会员手机号页面
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManualInputScreen(
    onConfirm: (String) -> Unit,
    onBack: () -> Unit
) {
    var input by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("手动输入") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                label = { Text("会员手机号/订单号") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Button(
                onClick = { onConfirm(input) },
                modifier = Modifier.fillMaxWidth(),
                enabled = input.isNotBlank()
            ) {
                Text("确认")
            }

            Text(
                text = "提示：可以输入会员手机号查询会员信息，或输入订单号查询订单",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
