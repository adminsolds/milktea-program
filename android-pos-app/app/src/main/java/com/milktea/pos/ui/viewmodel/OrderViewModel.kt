package com.milktea.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.milktea.pos.data.repository.ProductRepository
import com.milktea.pos.domain.model.CartItem
import com.milktea.pos.domain.model.Category
import com.milktea.pos.domain.model.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

/**
 * 点单页面 ViewModel
 */
@HiltViewModel
class OrderViewModel @Inject constructor(
    private val productRepository: ProductRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(OrderUiState())
    val uiState: StateFlow<OrderUiState> = _uiState

    private val _cartItems = MutableStateFlow<List<CartItem>>(emptyList())
    val cartItems: StateFlow<List<CartItem>> = _cartItems

    private val _categories = MutableStateFlow<List<Category>>(emptyList())
    val categories: StateFlow<List<Category>> = _categories

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products

    private val _selectedCategory = MutableStateFlow<Int?>(null)
    val selectedCategory: StateFlow<Int?> = _selectedCategory

    init {
        loadCategories()
        loadProducts()
    }

    /**
     * 加载分类列表
     */
    private fun loadCategories() {
        viewModelScope.launch {
            Timber.d("开始加载分类列表")
            _uiState.value = _uiState.value.copy(isLoading = true)
            productRepository.getCategories().collect { result ->
                result.onSuccess { categories ->
                    Timber.d("分类加载成功: ${categories.size} 个分类")
                    _categories.value = categories
                    _uiState.value = _uiState.value.copy(isLoading = false, error = null)
                }.onFailure { error ->
                    Timber.e("分类加载失败: ${error.message}")
                    _uiState.value = _uiState.value.copy(isLoading = false, error = error.message)
                }
            }
        }
    }

    /**
     * 加载商品列表
     */
    private fun loadProducts() {
        viewModelScope.launch {
            Timber.d("开始加载商品列表")
            _uiState.value = _uiState.value.copy(isLoading = true)
            productRepository.getProducts().collect { result ->
                result.onSuccess { products ->
                    Timber.d("商品加载成功: ${products.size} 个商品")
                    _products.value = products
                    _uiState.value = _uiState.value.copy(isLoading = false, error = null)
                }.onFailure { error ->
                    Timber.e("商品加载失败: ${error.message}")
                    _uiState.value = _uiState.value.copy(isLoading = false, error = error.message)
                }
            }
        }
    }

    fun selectCategory(categoryId: Int?) {
        _selectedCategory.value = categoryId
    }

    fun addToCart(item: CartItem) {
        val current = _cartItems.value.toMutableList()
        current.add(item)
        _cartItems.value = current
    }

    fun updateQuantity(item: CartItem, quantity: Int) {
        if (quantity <= 0) {
            removeFromCart(item)
        } else {
            val current = _cartItems.value.toMutableList()
            val index = current.indexOf(item)
            if (index >= 0) {
                current[index] = item.copy(quantity = quantity)
                _cartItems.value = current
            }
        }
    }

    fun removeFromCart(item: CartItem) {
        val current = _cartItems.value.toMutableList()
        current.remove(item)
        _cartItems.value = current
    }

    fun clearCart() {
        _cartItems.value = emptyList()
    }

    /**
     * 刷新数据
     */
    fun refresh() {
        loadCategories()
        loadProducts()
    }
}

data class OrderUiState(
    val isLoading: Boolean = false,
    val error: String? = null
)
