package com.milktea.pos.data.remote

/**
 * API 配置
 */
object ApiConfig {
    // 服务器基础地址
    // 模拟器开发环境：先执行 adb reverse tcp:8080 tcp:8080，然后使用 localhost
    // 真机开发环境使用电脑实际IP（如 192.168.x.x）
    // 生产环境使用服务器域名或IP
    const val BASE_URL = "http://localhost:8080/api/"

    // 连接超时时间（秒）
    const val CONNECT_TIMEOUT = 30L
    const val READ_TIMEOUT = 30L
    const val WRITE_TIMEOUT = 30L

    // 分页默认参数
    const val DEFAULT_PAGE = 1
    const val DEFAULT_PAGE_SIZE = 20
}
