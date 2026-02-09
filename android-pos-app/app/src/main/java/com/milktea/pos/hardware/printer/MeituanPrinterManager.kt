package com.milktea.pos.hardware.printer

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.util.Log
import com.milktea.pos.domain.model.Order
import com.milktea.pos.domain.model.OrderItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext
import java.nio.charset.Charset

/**
 * 美团MT-A3Sp打印机管理器
 * 支持USB接口的ESC-POS打印机
 */
class MeituanPrinterManager(private val context: Context) {

    companion object {
        private const val TAG = "MeituanPrinterManager"
        private const val ACTION_USB_PERMISSION = "com.milktea.pos.USB_PERMISSION"

        // USB打印机常用的Vendor ID和Product ID
        // 美团MT-A3Sp可能需要根据实际设备调整
        val COMMON_PRINTER_VIDS = listOf(0x0483, 0x1DB2, 0x6868, 0x04B8, 0x0EEF)
    }

    private val usbManager: UsbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    private var usbDevice: UsbDevice? = null
    private var usbConnection: UsbDeviceConnection? = null
    private var usbInterface: UsbInterface? = null
    private var usbEndpoint: UsbEndpoint? = null

    // 网络打印机
    private var networkSocket: java.net.Socket? = null
    private var networkOutputStream: java.io.OutputStream? = null
    private var printerIp: String? = null
    private var printerPort: Int = 9100  // 默认网络打印机端口

    // 打印机状态
    private val _printerState = MutableStateFlow<PrinterState>(PrinterState.Disconnected)
    val printerState: StateFlow<PrinterState> = _printerState

    // 打印机类型
    private var printerType: PrinterType = PrinterType.USB

    // USB权限广播接收器
    private val usbPermissionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (ACTION_USB_PERMISSION == intent.action) {
                synchronized(this) {
                    val device: UsbDevice? = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        device?.let {
                            connectPrinter(it)
                        }
                    } else {
                        Log.d(TAG, "USB permission denied for device $device")
                        _printerState.value = PrinterState.Error("USB权限被拒绝")
                    }
                }
            }
        }
    }

    init {
        // 注册USB权限广播接收器
        val filter = IntentFilter(ACTION_USB_PERMISSION)
        context.registerReceiver(usbPermissionReceiver, filter)
    }

    /**
     * 获取可用的USB打印机列表
     * 美团MT-A3Sp通常是USB打印机类设备
     */
    fun getAvailableUsbPrinters(): List<UsbDevice> {
        val deviceList = usbManager.deviceList.values.toList()
        Log.d(TAG, "Found ${deviceList.size} USB devices")

        // 打印所有设备信息，方便调试
        deviceList.forEach { device ->
            Log.d(TAG, "USB Device: ${device.deviceName}, VID: ${device.vendorId}, PID: ${device.productId}, Class: ${device.deviceClass}")
        }

        // 过滤可能是打印机的设备
        // 打印机通常是USB_CLASS_PRINTER (7) 或 USB_CLASS_MISC (9)
        return deviceList.filter { device ->
            val isPrinterClass = device.deviceClass == 7 || device.deviceClass == 9
            val isKnownPrinter = COMMON_PRINTER_VIDS.contains(device.vendorId)
            isPrinterClass || isKnownPrinter
        }
    }

    /**
     * 请求USB权限
     */
    fun requestUsbPermission(device: UsbDevice) {
        val permissionIntent = PendingIntent.getBroadcast(
            context, 0, Intent(ACTION_USB_PERMISSION),
            PendingIntent.FLAG_MUTABLE
        )
        usbManager.requestPermission(device, permissionIntent)
    }

    /**
     * 连接打印机
     */
    private fun connectPrinter(device: UsbDevice) {
        try {
            // 查找打印机接口（通常是Bulk Transfer接口）
            var printerInterface: UsbInterface? = null
            var printerEndpoint: UsbEndpoint? = null

            for (i in 0 until device.interfaceCount) {
                val intf = device.getInterface(i)
                Log.d(TAG, "Interface $i: Class=${intf.interfaceClass}, SubClass=${intf.interfaceSubclass}, Protocol=${intf.interfaceProtocol}")

                // 打印机接口通常是Class 7 (Printer)
                if (intf.interfaceClass == 7 || intf.interfaceClass == 9) {
                    for (j in 0 until intf.endpointCount) {
                        val endpoint = intf.getEndpoint(j)
                        Log.d(TAG, "  Endpoint $j: Type=${endpoint.type}, Dir=${endpoint.direction}")

                        // 查找Bulk Out端点
                        if (endpoint.type == UsbConstants.USB_ENDPOINT_XFER_BULK &&
                            endpoint.direction == UsbConstants.USB_DIR_OUT) {
                            printerInterface = intf
                            printerEndpoint = endpoint
                            break
                        }
                    }
                }
                if (printerEndpoint != null) break
            }

            if (printerInterface == null || printerEndpoint == null) {
                _printerState.value = PrinterState.Error("未找到打印机接口")
                return
            }

            val connection = usbManager.openDevice(device)
            if (connection == null) {
                _printerState.value = PrinterState.Error("无法打开USB设备")
                return
            }

            if (!connection.claimInterface(printerInterface, true)) {
                _printerState.value = PrinterState.Error("无法访问打印机接口")
                connection.close()
                return
            }

            usbDevice = device
            usbConnection = connection
            usbInterface = printerInterface
            usbEndpoint = printerEndpoint

            _printerState.value = PrinterState.Connected("USB: ${device.productName ?: "MT-A3Sp"}")
            Log.d(TAG, "Printer connected: ${device.productName}")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect printer", e)
            _printerState.value = PrinterState.Error(e.message ?: "连接失败")
        }
    }

    /**
     * 自动连接第一个可用的打印机
     */
    fun autoConnect(): Boolean {
        val printers = getAvailableUsbPrinters()
        if (printers.isEmpty()) {
            Log.w(TAG, "No USB printers found")
            return false
        }

        val printer = printers.first()
        if (usbManager.hasPermission(printer)) {
            connectPrinter(printer)
            return _printerState.value is PrinterState.Connected
        } else {
            requestUsbPermission(printer)
            return false
        }
    }

    /**
     * 连接网络打印机
     */
    suspend fun connectNetworkPrinter(ip: String, port: Int = 9100): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                // 断开现有连接
                disconnect()

                // 创建新的网络连接
                val socket = java.net.Socket()
                socket.connect(java.net.InetSocketAddress(ip, port), 5000)

                networkSocket = socket
                networkOutputStream = socket.getOutputStream()
                printerIp = ip
                printerPort = port
                printerType = PrinterType.NETWORK

                _printerState.value = PrinterState.Connected("Network: $ip:$port")
                Log.d(TAG, "Network printer connected: $ip:$port")
                Result.success(Unit)

            } catch (e: Exception) {
                Log.e(TAG, "Failed to connect network printer", e)
                _printerState.value = PrinterState.Error(e.message ?: "连接失败")
                Result.failure(e)
            }
        }
    }

    /**
     * 测试网络打印机连接
     */
    suspend fun testNetworkPrinter(ip: String, port: Int = 9100): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val socket = java.net.Socket()
                socket.connect(java.net.InetSocketAddress(ip, port), 3000)
                socket.close()
                Result.success(Unit)
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
    }

    /**
     * 打印数据（支持USB和网络）
     */
    suspend fun print(data: ByteArray): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                when (printerType) {
                    PrinterType.USB -> printUsb(data)
                    PrinterType.NETWORK -> printNetwork(data)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Print failed", e)
                _printerState.value = PrinterState.Error(e.message ?: "打印失败")
                Result.failure(e)
            }
        }
    }

    /**
     * USB打印
     */
    private fun printUsb(data: ByteArray): Result<Unit> {
        val connection = usbConnection
        val endpoint = usbEndpoint

        if (connection == null || endpoint == null) {
            // 尝试自动连接
            if (!autoConnect()) {
                return Result.failure(Exception("打印机未连接"))
            }
        }

        val conn = usbConnection ?: return Result.failure(Exception("打印机未连接"))
        val ep = usbEndpoint ?: return Result.failure(Exception("打印机端点未找到"))

        // 使用Bulk Transfer发送数据
        val chunkSize = 16384 // 16KB chunks
        var offset = 0

        while (offset < data.size) {
            val remaining = data.size - offset
            val size = minOf(chunkSize, remaining)
            val chunk = data.copyOfRange(offset, offset + size)

            val result = conn.bulkTransfer(ep, chunk, chunk.size, 5000)
            if (result < 0) {
                throw Exception("打印数据传输失败: $result")
            }

            offset += size
        }

        Log.d(TAG, "USB Print success: ${data.size} bytes")
        return Result.success(Unit)
    }

    /**
     * 网络打印
     */
    private fun printNetwork(data: ByteArray): Result<Unit> {
        val outputStream = networkOutputStream
            ?: return Result.failure(Exception("网络打印机未连接"))

        outputStream.write(data)
        outputStream.flush()

        Log.d(TAG, "Network Print success: ${data.size} bytes")
        return Result.success(Unit)
    }

    /**
     * 打印文本
     */
    suspend fun printText(text: String, charset: Charset = Charset.forName("GBK")): Result<Unit> {
        val data = text.toByteArray(charset)
        return print(data)
    }

    /**
     * 打印小票
     */
    suspend fun printReceipt(order: Order): Result<Unit> {
        return try {
            val receiptBuilder = ReceiptBuilder()
            val data = receiptBuilder.buildReceipt(order)
            print(data)
        } catch (e: Exception) {
            Log.e(TAG, "Build receipt failed", e)
            Result.failure(e)
        }
    }

    /**
     * 打印标签
     */
    suspend fun printLabel(order: Order, item: OrderItem, currentIndex: Int, totalCount: Int): Result<Unit> {
        return try {
            val labelBuilder = LabelBuilder()
            val data = labelBuilder.buildLabel(order, item, currentIndex, totalCount)
            print(data)
        } catch (e: Exception) {
            Log.e(TAG, "Build label failed", e)
            Result.failure(e)
        }
    }

    /**
     * 断开打印机连接
     */
    fun disconnect() {
        try {
            // 断开USB连接
            usbInterface?.let { intf ->
                usbConnection?.releaseInterface(intf)
            }
            usbConnection?.close()

            usbDevice = null
            usbConnection = null
            usbInterface = null
            usbEndpoint = null

            // 断开网络连接
            networkOutputStream?.close()
            networkSocket?.close()
            networkOutputStream = null
            networkSocket = null
            printerIp = null

            printerType = PrinterType.USB
            _printerState.value = PrinterState.Disconnected
            Log.d(TAG, "Printer disconnected")
        } catch (e: Exception) {
            Log.e(TAG, "Error disconnecting printer", e)
        }
    }

    /**
     * 释放资源
     */
    fun release() {
        disconnect()
        try {
            context.unregisterReceiver(usbPermissionReceiver)
        } catch (e: Exception) {
            // 忽略未注册的错误
        }
    }
}

/**
 * USB常量（Android SDK中可能没有定义）
 */
object UsbConstants {
    const val USB_ENDPOINT_XFER_BULK = 2
    const val USB_DIR_OUT = 0
}

/**
 * 打印机类型
 */
enum class PrinterType {
    USB,      // USB连接
    NETWORK   // 网络连接
}
