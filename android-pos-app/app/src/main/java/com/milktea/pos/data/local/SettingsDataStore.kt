package com.milktea.pos.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * 设置数据存储
 * 使用 DataStore 存储服务器地址等设置
 */
@Singleton
class SettingsDataStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

    companion object {
        val SERVER_URL = stringPreferencesKey("server_url")
        // 线上服务器地址（部署后使用）
        const val DEFAULT_SERVER_URL = "http://39.102.214.230:3000/api/"
        // 本地开发地址（开发时使用）
        const val DEV_SERVER_URL = "http://10.0.2.2:8080/api/"
    }

    /**
     * 获取服务器地址
     */
    val serverUrl: Flow<String> = context.dataStore.data
        .map { preferences ->
            preferences[SERVER_URL] ?: DEFAULT_SERVER_URL
        }

    /**
     * 保存服务器地址
     */
    suspend fun saveServerUrl(url: String) {
        context.dataStore.edit { preferences ->
            preferences[SERVER_URL] = url
        }
    }

    /**
     * 获取当前服务器地址（同步）
     */
    suspend fun getServerUrlSync(): String {
        return context.dataStore.data
            .map { preferences ->
                val url = preferences[SERVER_URL] ?: DEFAULT_SERVER_URL
                // 格式化 URL
                formatUrl(url)
            }
            .first()
    }

    /**
     * 格式化 URL
     */
    private fun formatUrl(url: String): String {
        var formatted = url.trim()

        // 确保以 / 结尾
        if (!formatted.endsWith("/")) {
            formatted = "$formatted/"
        }

        // 确保包含 /api/
        if (!formatted.contains("/api/")) {
            formatted = formatted.replace("/", "/api/")
            formatted = formatted.replace("/api//", "/api/")
        }

        return formatted
    }
}
