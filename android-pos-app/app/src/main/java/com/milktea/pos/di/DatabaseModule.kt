package com.milktea.pos.di

import android.content.Context
import androidx.room.Room
import com.milktea.pos.data.local.AppDatabase
import com.milktea.pos.data.local.dao.CategoryDao
import com.milktea.pos.data.local.dao.OrderDao
import com.milktea.pos.data.local.dao.ProductDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * 数据库模块 - Hilt 依赖注入
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            AppDatabase.DATABASE_NAME
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    @Singleton
    fun provideProductDao(database: AppDatabase): ProductDao {
        return database.productDao()
    }

    @Provides
    @Singleton
    fun provideCategoryDao(database: AppDatabase): CategoryDao {
        return database.categoryDao()
    }

    @Provides
    @Singleton
    fun provideOrderDao(database: AppDatabase): OrderDao {
        return database.orderDao()
    }
}
