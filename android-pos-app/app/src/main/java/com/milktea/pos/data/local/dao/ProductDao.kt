package com.milktea.pos.data.local.dao

import androidx.room.*
import com.milktea.pos.data.local.entity.ProductEntity
import kotlinx.coroutines.flow.Flow

/**
 * 商品 DAO
 */
@Dao
interface ProductDao {

    @Query("SELECT * FROM products WHERE isActive = 1 ORDER BY categoryId, id")
    fun getAllProducts(): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE categoryId = :categoryId AND isActive = 1")
    fun getProductsByCategory(categoryId: Int): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE id = :productId")
    suspend fun getProductById(productId: Int): ProductEntity?

    @Query("SELECT * FROM products WHERE name LIKE '%' || :query || '%' AND isActive = 1")
    fun searchProducts(query: String): Flow<List<ProductEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(products: List<ProductEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(product: ProductEntity)

    @Update
    suspend fun update(product: ProductEntity)

    @Delete
    suspend fun delete(product: ProductEntity)

    @Query("DELETE FROM products")
    suspend fun deleteAll()

    @Query("SELECT MAX(updatedAt) FROM products")
    suspend fun getLastUpdateTime(): Long?
}
