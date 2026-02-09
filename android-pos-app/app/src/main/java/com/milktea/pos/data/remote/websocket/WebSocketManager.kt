package com.milktea.pos.data.remote.websocket

import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.*
import java.util.concurrent.TimeUnit

/**
 * WebSocket 管理器
 * 用于实时接收订单推送
 */
class WebSocketManager(
    private val baseUrl: String,
    private val token: String? = null
) {
    companion object {
        private const val TAG = "WebSocketManager"
        private const val RECONNECT_DELAY = 5000L // 5秒重连
    }

    private val client = OkHttpClient.Builder()
        .pingInterval(30, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var isConnecting = false

    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private val _newOrder = MutableStateFlow<OrderMessage?>(null)
    val newOrder: StateFlow<OrderMessage?> = _newOrder.asStateFlow()

    private val _orderUpdate = MutableStateFlow<OrderUpdateMessage?>(null)
    val orderUpdate: StateFlow<OrderUpdateMessage?> = _orderUpdate.asStateFlow()

    /**
     * 连接 WebSocket
     */
    fun connect() {
        if (isConnecting || webSocket != null) return

        isConnecting = true
        _connectionState.value = ConnectionState.Connecting

        val wsUrl = baseUrl.replace("http://", "ws://")
            .replace("https://", "wss://")
            .trimEnd('/') + "/ws"

        val requestBuilder = Request.Builder().url(wsUrl)
        token?.let {
            requestBuilder.header("Authorization", "Bearer $it")
        }

        webSocket = client.newWebSocket(requestBuilder.build(), object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected")
                isConnecting = false
                _connectionState.value = ConnectionState.Connected
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d(TAG, "Received message: $text")
                handleMessage(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closing: $code - $reason")
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code - $reason")
                this@WebSocketManager.webSocket = null
                isConnecting = false
                _connectionState.value = ConnectionState.Disconnected
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket error", t)
                this@WebSocketManager.webSocket = null
                isConnecting = false
                _connectionState.value = ConnectionState.Error(t.message ?: "Unknown error")

                // 自动重连
                reconnect()
            }
        })
    }

    /**
     * 处理收到的消息
     */
    private fun handleMessage(text: String) {
        try {
            val json = Gson().fromJson(text, JsonObject::class.java)
            val type = json.get("type")?.asString

            when (type) {
                "NEW_ORDER" -> {
                    val order = Gson().fromJson(json.get("data"), OrderMessage::class.java)
                    _newOrder.value = order
                }
                "ORDER_UPDATE" -> {
                    val update = Gson().fromJson(json.get("data"), OrderUpdateMessage::class.java)
                    _orderUpdate.value = update
                }
                "PING" -> {
                    webSocket?.send("{\"type\":\"PONG\"}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse message", e)
        }
    }

    /**
     * 重新连接
     */
    private fun reconnect() {
        Thread {
            Thread.sleep(RECONNECT_DELAY)
            connect()
        }.start()
    }

    /**
     * 断开连接
     */
    fun disconnect() {
        webSocket?.close(1000, "Client disconnect")
        webSocket = null
        isConnecting = false
        _connectionState.value = ConnectionState.Disconnected
    }

    /**
     * 订阅订单更新
     */
    fun subscribeToOrders() {
        val message = """{"type":"SUBSCRIBE","channel":"orders"}"""
        webSocket?.send(message)
    }

    /**
     * 订阅店铺订单
     */
    fun subscribeToStore(storeId: Int) {
        val message = """{"type":"SUBSCRIBE","channel":"store","storeId":$storeId}"""
        webSocket?.send(message)
    }
}

/**
 * 连接状态
 */
sealed class ConnectionState {
    object Disconnected : ConnectionState()
    object Connecting : ConnectionState()
    object Connected : ConnectionState()
    data class Error(val message: String) : ConnectionState()
}

/**
 * 订单消息
 */
data class OrderMessage(
    val id: Int,
    val orderNo: String,
    val orderType: String,
    val status: String,
    val finalPrice: Double,
    val createdAt: Long
)

/**
 * 订单更新消息
 */
data class OrderUpdateMessage(
    val orderId: Int,
    val status: String,
    val updatedAt: Long
)
