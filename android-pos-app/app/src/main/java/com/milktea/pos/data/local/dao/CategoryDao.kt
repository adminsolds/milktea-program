package com.milktea.pos.data.local.dao

import androidx.room.*
import com.milktea.pos.data.local.entity.CategoryEntity
import kotlinx.coroutines.flow.Flow

/**
 * 分类 DAO
 */
@Dao
interface CategoryDao {

    @Query("SELECT * FROM categories WHERE isActive = 1 ORDER BY sortOrder")
    fun getAllCategories(): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM categories WHERE id = :categoryId")
    suspend fun getCategoryById(categoryId: Int): CategoryEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(categories: List<CategoryEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(category: CategoryEntity)

    @Update
    suspend fun update(category: CategoryEntity)

    @Delete
    suspend fun delete(category: CategoryEntity)

    @Query("DELETE FROM categories")
    suspend fun deleteAll()
}
