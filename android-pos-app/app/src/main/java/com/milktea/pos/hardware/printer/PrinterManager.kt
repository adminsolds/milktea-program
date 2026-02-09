package com.milktea.pos.hardware.printer

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.util.Log
import com.hoho.android.usbserial.driver.UsbSerialDriver
import com.hoho.android.usbserial.driver.UsbSerialPort
import com.hoho.android.usbserial.driver.UsbSerialProber
import com.hoho.android.usbserial.util.SerialInputOutputManager
import com.milktea.pos.domain.model.Order
import com.milktea.pos.domain.model.OrderItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext
import java.io.IOException
import java.net.Socket
import java.nio.charset.Charset

/**
 * 打印机管理器
 * 支持 USB 和网络打印机
 */
class PrinterManager(private val context: Context) {

    companion object {
        private const val TAG = "PrinterManager"
        private const val ACTION_USB_PERMISSION = "com.milktea.pos.USB_PERMISSION"
        
        // ESC/POS 指令
        private val ESC = 0x1B.toByte()
        private val GS = 0x1D.toByte()
        private val LF = 0x0A.toByte()
        private val NUL = 0x00.toByte()
    }

    private val usbManager: UsbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    private var usbSerialPort: UsbSerialPort? = null
    private var ioManager: SerialInputOutputManager? = null
    private var networkSocket: Socket? = null
    
    // 打印机状态
    private val _printerState = MutableStateFlow<PrinterState>(PrinterState.Disconnected)
    val printerState: StateFlow<PrinterState> = _printerState
    
    // USB 权限广播接收器
    private val usbPermissionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (ACTION_USB_PERMISSION == intent.action) {
                synchronized(this) {
                    val device: UsbDevice? = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        device?.let {
                            connectUsbPrinter(it)
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
        // 注册 USB 权限广播接收器
        val filter = IntentFilter(ACTION_USB_PERMISSION)
        context.registerReceiver(usbPermissionReceiver, filter)
    }

    /**
     * 获取可用的 USB 打印机列表
     */
    fun getAvailableUsbPrinters(): List<UsbDevice> {
        val availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager)
        return availableDrivers.map { it.device }
    }

    /**
     * 请求 USB 权限并连接打印机
     */
    fun requestUsbPermission(device: UsbDevice) {
        val permissionIntent = PendingIntent.getBroadcast(
            context, 0, Intent(ACTION_USB_PERMISSION),
            PendingIntent.FLAG_MUTABLE
        )
        usbManager.requestPermission(device, permissionIntent)
    }

    /**
     * 连接 USB 打印机
     */
    private fun connectUsbPrinter(device: UsbDevice) {
        try {
            val availableDrivers = UsbSerialProber.getDefaultProber().findAllDrivers(usbManager)
            val driver = availableDrivers.find { it.device == device }
            
            if (driver == null) {
                _printerState.value = PrinterState.Error("未找到打印机驱动")
                return
            }

            val connection = usbManager.openDevice(driver.device)
            if (connection == null) {
                _printerState.value = PrinterState.Error("无法打开USB设备")
                return
            }

            usbSerialPort = driver.ports.firstOrNull()
            usbSerialPort?.open(connection)
            usbSerialPort?.setParameters(9600, 8, UsbSerialPort.STOPBITS_1, UsbSerialPort.PARITY_NONE)

            _printerState.value = PrinterState.Connected("USB: ${device.productName}")
            Log.d(TAG, "USB printer connected: ${device.productName}")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect USB printer", e)
            _printerState.value = PrinterState.Error(e.message ?: "连接失败")
        }
    }

    /**
     * 连接网络打印机
     */
    suspend fun connectNetworkPrinter(ip: String, port: Int): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                networkSocket?.close()
                networkSocket = Socket(ip, port)
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
     * 打印数据
     */
    suspend fun print(data: ByteArray): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                when (_printerState.value) {
                    is PrinterState.Connected -> {
                        // 尝试 USB 打印
                        usbSerialPort?.write(data, 5000)
                            ?: networkSocket?.getOutputStream()?.write(data)
                            ?: throw IOException("打印机未连接")
                        
                        Result.success(Unit)
                    }
                    else -> {
                        Result.failure(IOException("打印机未连接"))
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Print failed", e)
                _printerState.value = PrinterState.Error(e.message ?: "打印失败")
                Result.failure(e)
            }
        }
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
        val receiptBuilder = ReceiptBuilder()
        val data = receiptBuilder.buildReceipt(order)
        return print(data)
    }

    /**
     * 打印标签
     */
    suspend fun printLabel(order: Order, item: OrderItem, currentIndex: Int, totalCount: Int): Result<Unit> {
        val labelBuilder = LabelBuilder()
        val data = labelBuilder.buildLabel(order, item, currentIndex, totalCount)
        return print(data)
    }

    /**
     * 断开打印机连接
     */
    fun disconnect() {
        try {
            ioManager?.stop()
            ioManager = null
            
            usbSerialPort?.close()
            usbSerialPort = null
            
            networkSocket?.close()
            networkSocket = null
            
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
 * 打印机状态
 */
sealed class PrinterState {
    object Disconnected : PrinterState()
    data class Connected(val info: String) : PrinterState()
    data class Error(val message: String) : PrinterState()
}
