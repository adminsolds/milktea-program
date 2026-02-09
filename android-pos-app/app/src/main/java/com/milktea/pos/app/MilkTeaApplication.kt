package com.milktea.pos.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber

/**
 * 应用程序入口
 */
@HiltAndroidApp
class MilkTeaApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        // 初始化日志 - 始终启用调试日志
        Timber.plant(Timber.DebugTree())

        Timber.d("MilkTeaApplication initialized")
    }
}
