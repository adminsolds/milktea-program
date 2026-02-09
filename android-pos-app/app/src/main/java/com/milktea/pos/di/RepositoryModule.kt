package com.milktea.pos.di

import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/**
 * 仓库模块 - Hilt 依赖注入
 * 
 * 注意：Repository 类使用构造函数注入，不需要额外的 @Provides 方法
 */
@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {
    // Repository 类通过构造函数注入自动提供
    // 不需要额外的 @Provides 方法
}
