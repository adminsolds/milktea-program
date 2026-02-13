const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateAdmin } = require('../middleware/auth');

// 分类相关路由
router.get('/categories', productController.getCategories);
router.get('/categories/:id', productController.getCategoryById);
router.post('/categories', authenticateAdmin, productController.createCategory);
router.put('/categories/:id', authenticateAdmin, productController.updateCategory);
router.delete('/categories/:id', authenticateAdmin, productController.deleteCategory);

// 商品相关路由
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', authenticateAdmin, productController.createProduct);
router.put('/:id', authenticateAdmin, productController.updateProduct);
router.delete('/:id', authenticateAdmin, productController.deleteProduct);

// 商品规格相关路由
router.get('/:id/specs', productController.getProductSpecs);
router.post('/:id/specs', productController.createProductSpec);
router.put('/specs/:specId', productController.updateProductSpec);
router.delete('/specs/:specId', productController.deleteProductSpec);
router.post('/:id/specs/batch', productController.batchUpdateProductSpecs);

module.exports = router;