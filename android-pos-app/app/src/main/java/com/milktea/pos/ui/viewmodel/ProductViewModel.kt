package com.milktea.pos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.milktea.pos.data.repository.ProductRepository
import com.milktea.pos.domain.model.Category
import com.milktea.pos.domain.model.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * 商品 ViewModel
 */
@HiltViewModel
class ProductViewModel @Inject constructor(
    private val productRepository: ProductRepository
) : ViewModel() {

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _categories = MutableStateFlow<List<Category>>(emptyList())
    val categories: StateFlow<List<Category>> = _categories.asStateFlow()

    private val _filteredProducts = MutableStateFlow<List<Product>>(emptyList())
    val filteredProducts: StateFlow<List<Product>> = _filteredProducts.asStateFlow()

    private val _selectedCategory = MutableStateFlow<Int?>(null)
    val selectedCategory: StateFlow<Int?> = _selectedCategory.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadProducts()
        loadCategories()
    }

    /**
     * 加载商品列表
     */
    fun loadProducts() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            productRepository.getProducts().collect { result ->
                _isLoading.value = false
                result.onSuccess {
                    _products.value = it
                    filterProducts()
                }.onFailure {
                    _error.value = it.message
                }
            }
        }
    }

    /**
     * 加载分类列表
     */
    fun loadCategories() {
        viewModelScope.launch {
            productRepository.getCategories().collect { result ->
                result.onSuccess {
                    _categories.value = it
                }.onFailure {
                    _error.value = it.message
                }
            }
        }
    }

    /**
     * 选择分类
     */
    fun selectCategory(categoryId: Int?) {
        _selectedCategory.value = categoryId
        filterProducts()
    }

    /**
     * 筛选商品
     */
    private fun filterProducts() {
        val categoryId = _selectedCategory.value
        _filteredProducts.value = if (categoryId == null) {
            _products.value
        } else {
            _products.value.filter { it.categoryId == categoryId }
        }
    }

    /**
     * 搜索商品
     */
    fun searchProducts(query: String) {
        if (query.isBlank()) {
            filterProducts()
        } else {
            _filteredProducts.value = _products.value.filter {
                it.name.contains(query, ignoreCase = true)
            }
        }
    }

    /**
     * 清除错误
     */
    fun clearError() {
        _error.value = null
    }
}
