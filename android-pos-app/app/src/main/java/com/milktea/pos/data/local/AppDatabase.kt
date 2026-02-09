package com.milktea.pos.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.milktea.pos.data.local.dao.CategoryDao
import com.milktea.pos.data.local.dao.OrderDao
import com.milktea.pos.data.local.dao.ProductDao
import com.milktea.pos.data.local.entity.CategoryEntity
import com.milktea.pos.data.local.entity.OrderEntity
import com.milktea.pos.data.local.entity.ProductEntity

/**
 * Room 数据库
 */
@Database(
    entities = [
        ProductEntity::class,
        CategoryEntity::class,
        OrderEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    abstract fun categoryDao(): CategoryDao
    abstract fun orderDao(): OrderDao

    companion object {
        const val DATABASE_NAME = "milktea_pos.db"
    }
}
