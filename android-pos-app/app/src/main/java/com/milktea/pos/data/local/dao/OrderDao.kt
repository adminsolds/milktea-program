package com.milktea.pos.data.local.dao

import androidx.room.*
import com.milktea.pos.data.local.entity.OrderEntity
import kotlinx.coroutines.flow.Flow

/**
 * 订单 DAO
 */
@Dao
interface OrderDao {

    @Query("SELECT * FROM orders ORDER BY createdAt DESC")
    fun getAllOrders(): Flow<List<OrderEntity>>

    @Query("SELECT * FROM orders WHERE status = :status ORDER BY createdAt DESC")
    fun getOrdersByStatus(status: String): Flow<List<OrderEntity>>

    @Query("SELECT * FROM orders WHERE id = :orderId")
    suspend fun getOrderById(orderId: Int): OrderEntity?

    @Query("SELECT * FROM orders WHERE isSynced = 0")
    suspend fun getUnsyncedOrders(): List<OrderEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(order: OrderEntity)

    @Update
    suspend fun update(order: OrderEntity)

    @Query("UPDATE orders SET isSynced = 1 WHERE id = :orderId")
    suspend fun markAsSynced(orderId: Int)

    @Delete
    suspend fun delete(order: OrderEntity)

    @Query("DELETE FROM orders WHERE createdAt < :timestamp")
    suspend fun deleteOldOrders(timestamp: Long)

    @Query("SELECT COUNT(*) FROM orders WHERE DATE(createdAt / 1000, 'unixepoch') = DATE('now')")
    fun getTodayOrderCount(): Flow<Int>

    @Query("SELECT SUM(finalPrice) FROM orders WHERE DATE(createdAt / 1000, 'unixepoch') = DATE('now') AND status != 'CANCELLED'")
    fun getTodayRevenue(): Flow<Double?>
}
