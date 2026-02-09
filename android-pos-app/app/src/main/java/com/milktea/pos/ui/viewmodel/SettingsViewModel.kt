package com.milktea.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.milktea.pos.data.local.SettingsDataStore
import com.milktea.pos.data.remote.ApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

/**
 * 设置页面 ViewModel
 */
@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsDataStore: SettingsDataStore,
    private val apiService: ApiService
) : ViewModel() {

    private val _printerState = MutableStateFlow<com.milktea.pos.hardware.printer.PrinterState>(
        com.milktea.pos.hardware.printer.PrinterState.Disconnected
    )
    val printerState: StateFlow<com.milktea.pos.hardware.printer.PrinterState> = _printerState.asStateFlow()

    private val _serverUrl = MutableStateFlow(SettingsDataStore.DEFAULT_SERVER_URL)
    val serverUrl: StateFlow<String> = _serverUrl.asStateFlow()

    private val _connectionStatus = MutableStateFlow<ConnectionStatus>(ConnectionStatus.Idle)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    init {
        // 加载保存的服务器地址
        viewModelScope.launch {
            settingsDataStore.serverUrl.collect { url ->
                _serverUrl.value = url
            }
        }
    }

    /**
     * 连接打印机
     */
    fun connectPrinter() {
        // TODO: 实现打印机连接
        _printerState.value = com.milktea.pos.hardware.printer.PrinterState.Connected("USB打印机")
    }

    /**
     * 断开打印机
     */
    fun disconnectPrinter() {
        _printerState.value = com.milktea.pos.hardware.printer.PrinterState.Disconnected
    }

    /**
     * 测试打印
     */
    fun testPrint() {
        // TODO: 实现测试打印
        Timber.d("测试打印")
    }

    /**
     * 更新服务器地址
     */
    fun updateServerUrl(url: String) {
        viewModelScope.launch {
            try {
                // 格式化 URL
                var formattedUrl = url.trim()

                // 确保以 http:// 或 https:// 开头
                if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
                    formattedUrl = "http://$formattedUrl"
                }

                // 确保以 / 结尾
                if (!formattedUrl.endsWith("/")) {
                    formattedUrl = "$formattedUrl/"
                }

                // 确保包含 /api/
                if (!formattedUrl.contains("/api/")) {
                    formattedUrl = formattedUrl.replace("/", "/api/")
                    formattedUrl = formattedUrl.replace("/api//", "/api/")
                }

                settingsDataStore.saveServerUrl(formattedUrl)
                _serverUrl.value = formattedUrl
                Timber.d("服务器地址已保存: $formattedUrl")

                // 提示用户需要重启 APP
                _connectionStatus.value = ConnectionStatus.Success("服务器地址已保存，请重启APP生效")

            } catch (e: Exception) {
                Timber.e(e, "保存服务器地址失败")
                _connectionStatus.value = ConnectionStatus.Error("保存失败: ${e.message}")
            }
        }
    }

    /**
     * 测试服务器连接
     */
    fun testServerConnection() {
        viewModelScope.launch {
            _connectionStatus.value = ConnectionStatus.Loading

            try {
                // 尝试调用健康检查接口
                val response = apiService.getHealth()
                if (response.isSuccessful) {
                    _connectionStatus.value = ConnectionStatus.Success("连接成功！")
                    Timber.d("服务器连接测试成功")
                } else {
                    _connectionStatus.value = ConnectionStatus.Error("连接失败: HTTP ${response.code()}")
                    Timber.e("服务器连接测试失败: HTTP ${response.code()}")
                }
            } catch (e: Exception) {
                _connectionStatus.value = ConnectionStatus.Error("连接失败: ${e.message}")
                Timber.e(e, "服务器连接测试失败")
            }
        }
    }

    /**
     * 清除连接状态
     */
    fun clearConnectionStatus() {
        _connectionStatus.value = ConnectionStatus.Idle
    }

    /**
     * 退出登录
     */
    fun logout() {
        // TODO: 实现退出登录
        Timber.d("退出登录")
    }
}

/**
 * 连接状态
 */
sealed class ConnectionStatus {
    object Idle : ConnectionStatus()
    object Loading : ConnectionStatus()
    data class Success(val message: String) : ConnectionStatus()
    data class Error(val message: String) : ConnectionStatus()
}
