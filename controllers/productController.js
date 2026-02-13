const { Product, Category, ProductSpec } = require('../models');

// 辅助函数：确保图片URL是完整URL
function ensureFullUrl(url) {
  if (!url) return url;
  
  // 替换旧端口 3000 为新端口 3003
  return url.replace(/:3000/g, ':3003');
}

// 获取商品列表
const getProducts = async (req, res) => {
  try {
    const { category_id, page = 1, limit = 10, is_new, is_recommended } = req.query;

    const where = {};
    if (category_id) where.category_id = category_id;
    if (is_new) where.is_new = is_new;
    if (is_recommended) where.is_recommended = is_recommended;

    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    // 获取所有商品的ID
    const productIds = rows.map(p => p.id);

    // 批量查询所有规格
    let allSpecs = [];
    if (productIds.length > 0) {
      allSpecs = await ProductSpec.findAll({
        where: { product_id: productIds },
        order: [['type', 'ASC'], ['id', 'ASC']]
      });
    }

    // 按商品ID分组规格
    const specsByProductId = {};
    allSpecs.forEach(spec => {
      if (!specsByProductId[spec.product_id]) {
        specsByProductId[spec.product_id] = [];
      }
      specsByProductId[spec.product_id].push(spec);
    });

    // 格式化商品数据，包含规格信息
    const formattedProducts = rows.map(product => {
      const productData = product.toJSON();
      const specs = specsByProductId[product.id] || [];

      // 从商品的杯型价格生成 sizes 数组（只包含启用的杯型）
      const sizes = [];
      if (productData.price_small && productData.enable_size_small) {
        sizes.push({ name: '小杯', price: parseFloat(productData.price_small) });
      }
      if (productData.price_medium && productData.enable_size_medium) {
        sizes.push({ name: '中杯', price: parseFloat(productData.price_medium) });
      }
      if (productData.price_large && productData.enable_size_large) {
        sizes.push({ name: '大杯', price: parseFloat(productData.price_large) });
      }

      const iceSpecs = specs.filter(s => s.type === 'ice').map(s => s.name);
      const sugarSpecs = specs.filter(s => s.type === 'sugar').map(s => s.name);
      const toppingSpecs = specs
        .filter(s => s.type === 'topping')
        .map(s => ({
          name: s.name,
          price: parseFloat(s.price)
        }));

      return {
        ...productData,
        sizes: sizes.length > 0 ? sizes : [
          { name: '中杯', price: parseFloat(productData.price) || 0 }
        ],
        specs: iceSpecs.length > 0 ? iceSpecs : ['正常冰', '少冰', '去冰'],
        sugars: sugarSpecs.length > 0 ? sugarSpecs : ['无糖', '三分糖', '五分糖', '七分糖', '全糖'],
        toppings: toppingSpecs,
        is_active: Boolean(productData.is_active)
      };
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      products: formattedProducts
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取商品详情
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ProductSpec,
          as: 'specs'
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 格式化商品数据，包含规格信息（与列表API保持一致）
    const productData = product.toJSON();
    const specs = productData.specs || [];

    // 从商品的杯型价格生成 sizes 数组（只包含启用的杯型）
    const sizes = [];
    if (productData.price_small && productData.enable_size_small) {
      sizes.push({ name: '小杯', price: parseFloat(productData.price_small) });
    }
    if (productData.price_medium && productData.enable_size_medium) {
      sizes.push({ name: '中杯', price: parseFloat(productData.price_medium) });
    }
    if (productData.price_large && productData.enable_size_large) {
      sizes.push({ name: '大杯', price: parseFloat(productData.price_large) });
    }

    const iceSpecs = specs.filter(s => s.type === 'ice').map(s => s.name);
    const sugarSpecs = specs.filter(s => s.type === 'sugar').map(s => s.name);
    const toppingSpecs = specs
      .filter(s => s.type === 'topping')
      .map(s => ({
        name: s.name,
        price: parseFloat(s.price)
      }));

    const formattedProduct = {
      ...productData,
      sizes: sizes.length > 0 ? sizes : [
        { name: '中杯', price: parseFloat(productData.price) || 0 }
      ],
      specs: iceSpecs.length > 0 ? iceSpecs : ['正常冰', '少冰', '去冰'],
      sugars: sugarSpecs.length > 0 ? sugarSpecs : ['无糖', '三分糖', '五分糖', '七分糖', '全糖'],
      toppings: toppingSpecs,
      is_active: Boolean(productData.is_active)
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error('Get product by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建商品
const createProduct = async (req, res) => {
  try {
    const { category_id, name, desc, price_small, price_medium, price_large, delivery_fee, image, tags, is_new, is_recommended, enable_toppings, enable_size_small, enable_size_medium, enable_size_large, enable_ice, enable_sugar } = req.body;

    if (!category_id || !name) {
      return res.status(400).json({ error: 'Category ID and name are required' });
    }

    // 验证：启用的杯型必须填写价格
    if (enable_size_small && (!price_small || parseFloat(price_small) <= 0)) {
      return res.status(400).json({ error: '启用小杯时，必须填写小杯价格且价格必须大于0' });
    }
    if (enable_size_medium && (!price_medium || parseFloat(price_medium) <= 0)) {
      return res.status(400).json({ error: '启用中杯时，必须填写中杯价格且价格必须大于0' });
    }
    if (enable_size_large && (!price_large || parseFloat(price_large) <= 0)) {
      return res.status(400).json({ error: '启用大杯时，必须填写大杯价格且价格必须大于0' });
    }

    // 验证：至少启用一个杯型
    if (!enable_size_small && !enable_size_medium && !enable_size_large) {
      return res.status(400).json({ error: '至少启用一个杯型' });
    }

    // 确保杯型价格是数字类型
    const numericPriceSmall = price_small ? parseFloat(price_small) : null;
    const numericPriceMedium = price_medium ? parseFloat(price_medium) : null;
    const numericPriceLarge = price_large ? parseFloat(price_large) : null;
    const numericDeliveryFee = delivery_fee !== undefined ? parseFloat(delivery_fee) : 0.00;

    if ((numericPriceSmall && isNaN(numericPriceSmall)) || (numericPriceMedium && isNaN(numericPriceMedium)) || (numericPriceLarge && isNaN(numericPriceLarge)) || isNaN(numericDeliveryFee)) {
      return res.status(400).json({ error: 'Prices must be valid numbers' });
    }

    // 使用中杯价格作为默认价格
    const defaultPrice = numericPriceMedium || numericPriceSmall || numericPriceLarge;

    const product = await Product.create({
      category_id,
      name,
      desc,
      price: defaultPrice,
      price_small: numericPriceSmall,
      price_medium: numericPriceMedium,
      price_large: numericPriceLarge,
      delivery_fee: numericDeliveryFee,
      image,
      tags,
      is_new: is_new || 0,
      is_recommended: is_recommended || 0,
      enable_toppings: enable_toppings !== undefined ? enable_toppings : 1,
      enable_size_small: enable_size_small !== undefined ? enable_size_small : 1,
      enable_size_medium: enable_size_medium !== undefined ? enable_size_medium : 1,
      enable_size_large: enable_size_large !== undefined ? enable_size_large : 1,
      enable_size: (enable_size_small || enable_size_medium || enable_size_large) ? 1 : 0,
      enable_ice: enable_ice !== undefined ? enable_ice : 1,
      enable_sugar: enable_sugar !== undefined ? enable_sugar : 1
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新商品
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, desc, price_small, price_medium, price_large, delivery_fee, image, tags, is_new, is_recommended, enable_toppings, enable_size_small, enable_size_medium, enable_size_large, enable_ice, enable_sugar } = req.body;

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 验证：启用的杯型必须填写价格
    const finalEnableSizeSmall = enable_size_small !== undefined ? enable_size_small : product.enable_size_small;
    const finalEnableSizeMedium = enable_size_medium !== undefined ? enable_size_medium : product.enable_size_medium;
    const finalEnableSizeLarge = enable_size_large !== undefined ? enable_size_large : product.enable_size_large;

    if (finalEnableSizeSmall) {
      const finalPriceSmall = price_small !== undefined ? parseFloat(price_small) : product.price_small;
      if (!finalPriceSmall || finalPriceSmall <= 0) {
        return res.status(400).json({ error: '启用小杯时，必须填写小杯价格且价格必须大于0' });
      }
    }
    if (finalEnableSizeMedium) {
      const finalPriceMedium = price_medium !== undefined ? parseFloat(price_medium) : product.price_medium;
      if (!finalPriceMedium || finalPriceMedium <= 0) {
        return res.status(400).json({ error: '启用中杯时，必须填写中杯价格且价格必须大于0' });
      }
    }
    if (finalEnableSizeLarge) {
      const finalPriceLarge = price_large !== undefined ? parseFloat(price_large) : product.price_large;
      if (!finalPriceLarge || finalPriceLarge <= 0) {
        return res.status(400).json({ error: '启用大杯时，必须填写大杯价格且价格必须大于0' });
      }
    }

    // 验证：至少启用一个杯型
    if (!finalEnableSizeSmall && !finalEnableSizeMedium && !finalEnableSizeLarge) {
      return res.status(400).json({ error: '至少启用一个杯型' });
    }

    // 处理杯型价格
    let numericPriceSmall = product.price_small;
    let numericPriceMedium = product.price_medium;
    let numericPriceLarge = product.price_large;
    let numericDeliveryFee = product.delivery_fee;

    if (price_small !== undefined) {
      if (price_small === null) {
        numericPriceSmall = null;
      } else {
        numericPriceSmall = parseFloat(price_small);
        if (isNaN(numericPriceSmall)) {
          return res.status(400).json({ error: 'Small cup price must be a valid number' });
        }
      }
    }
    if (price_medium !== undefined) {
      if (price_medium === null) {
        numericPriceMedium = null;
      } else {
        numericPriceMedium = parseFloat(price_medium);
        if (isNaN(numericPriceMedium)) {
          return res.status(400).json({ error: 'Medium cup price must be a valid number' });
        }
      }
    }
    if (price_large !== undefined) {
      if (price_large === null) {
        numericPriceLarge = null;
      } else {
        numericPriceLarge = parseFloat(price_large);
        if (isNaN(numericPriceLarge)) {
          return res.status(400).json({ error: 'Large cup price must be a valid number' });
        }
      }
    }
    if (delivery_fee !== undefined) {
      numericDeliveryFee = parseFloat(delivery_fee);
      if (isNaN(numericDeliveryFee)) {
        return res.status(400).json({ error: 'Delivery fee must be a valid number' });
      }
    }

    // 使用中杯价格作为默认价格
    const defaultPrice = numericPriceMedium || numericPriceSmall || numericPriceLarge || product.price;

    await product.update({
      category_id: category_id || product.category_id,
      name: name || product.name,
      desc: desc !== undefined ? desc : product.desc,
      price: defaultPrice,
      price_small: numericPriceSmall,
      price_medium: numericPriceMedium,
      price_large: numericPriceLarge,
      delivery_fee: numericDeliveryFee,
      image: image !== undefined ? image : product.image,
      tags: tags !== undefined ? tags : product.tags,
      is_new: is_new !== undefined ? is_new : product.is_new,
      is_recommended: is_recommended !== undefined ? is_recommended : product.is_recommended,
      enable_toppings: enable_toppings !== undefined ? enable_toppings : product.enable_toppings,
      enable_size_small: enable_size_small !== undefined ? enable_size_small : product.enable_size_small,
      enable_size_medium: enable_size_medium !== undefined ? enable_size_medium : product.enable_size_medium,
      enable_size_large: enable_size_large !== undefined ? enable_size_large : product.enable_size_large,
      enable_size: (enable_size_small !== undefined ? enable_size_small : product.enable_size_small) ||
                   (enable_size_medium !== undefined ? enable_size_medium : product.enable_size_medium) ||
                   (enable_size_large !== undefined ? enable_size_large : product.enable_size_large) ? 1 : 0,
      enable_ice: enable_ice !== undefined ? enable_ice : product.enable_ice,
      enable_sugar: enable_sugar !== undefined ? enable_sugar : product.enable_sugar
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除商品
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await product.destroy();
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取分类列表
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: 1 },
      order: [['sort_order', 'ASC']]
    });

    // 处理图标URL，确保是完整URL，并将 is_active 转换为布尔值
    const processedCategories = categories.map(category => {
      const categoryData = category.toJSON();
      return {
        ...categoryData,
        icon: ensureFullUrl(categoryData.icon),
        is_active: Boolean(categoryData.is_active)
      };
    });

    res.json(processedCategories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取单个分类详情
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryData = category.toJSON();
    res.json({
      ...categoryData,
      icon: ensureFullUrl(categoryData.icon),
      is_active: Boolean(categoryData.is_active)
    });
  } catch (error) {
    console.error('Get category by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建分类
const createCategory = async (req, res) => {
  try {
    const { name, desc, icon, sort_order } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const category = await Category.create({
      name,
      desc,
      icon: ensureFullUrl(icon),
      sort_order: sort_order || 0
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新分类
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, desc, icon, sort_order, is_active } = req.body;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // 处理图标URL，确保是完整URL
    const processedIcon = icon !== undefined ? ensureFullUrl(icon) : category.icon;
    
    await category.update({
      name: name || category.name,
      desc: desc || category.desc,
      icon: processedIcon,
      sort_order: sort_order !== undefined ? sort_order : category.sort_order,
      is_active: is_active !== undefined ? is_active : category.is_active
    });
    
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除分类
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // 检查是否有商品属于该分类
    const productCount = await Product.count({ where: { category_id: id } });
    if (productCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }
    
    await category.destroy();
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 商品规格相关功能

// 获取商品规格列表
const getProductSpecs = async (req, res) => {
  try {
    const { id } = req.params;
    
    const specs = await ProductSpec.findAll({
      where: { product_id: id },
      order: [['type', 'ASC'], ['id', 'ASC']]
    });
    
    res.json(specs);
  } catch (error) {
    console.error('Get product specs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建商品规格
const createProductSpec = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, price, is_required } = req.body;
    
    if (!type || !name) {
      return res.status(400).json({ error: 'Type and name are required' });
    }
    
    const spec = await ProductSpec.create({
      product_id: id,
      type,
      name,
      price: price || 0.00,
      is_required: is_required || 0
    });
    
    res.status(201).json(spec);
  } catch (error) {
    console.error('Create product spec error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新商品规格
const updateProductSpec = async (req, res) => {
  try {
    const { specId } = req.params;
    const { type, name, price, is_required } = req.body;
    
    const spec = await ProductSpec.findByPk(specId);
    
    if (!spec) {
      return res.status(404).json({ error: 'Product spec not found' });
    }
    
    await spec.update({
      type: type || spec.type,
      name: name || spec.name,
      price: price !== undefined ? price : spec.price,
      is_required: is_required !== undefined ? is_required : spec.is_required
    });
    
    res.json(spec);
  } catch (error) {
    console.error('Update product spec error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除商品规格
const deleteProductSpec = async (req, res) => {
  try {
    const { specId } = req.params;
    
    const spec = await ProductSpec.findByPk(specId);
    
    if (!spec) {
      return res.status(404).json({ error: 'Product spec not found' });
    }
    
    await spec.destroy();
    
    res.json({ message: 'Product spec deleted successfully' });
  } catch (error) {
    console.error('Delete product spec error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 批量更新商品规格
const batchUpdateProductSpecs = async (req, res) => {
  try {
    const { id } = req.params;
    const specs = req.body.specs;
    const applyToGlobal = req.body.applyToGlobal === true;

    if (!Array.isArray(specs)) {
      return res.status(400).json({ error: 'Specs must be an array' });
    }

    if (applyToGlobal) {
      // 应用至全局：获取所有商品ID
      const { Product } = require('../models');
      const allProducts = await Product.findAll({
        attributes: ['id'],
        where: { is_active: 1 }  // 只更新激活的商品
      });

      const productIds = allProducts.map(p => p.id);

      // 删除所有商品的旧规格
      await ProductSpec.destroy({ where: { product_id: productIds } });

      // 为每个商品创建新规格
      const allNewSpecs = [];
      for (const productId of productIds) {
        const productSpecs = specs.map(spec => ({
          product_id: productId,
          type: spec.type,
          name: spec.name,
          price: spec.price || 0.00,
          is_required: spec.is_required || 0
        }));
        allNewSpecs.push(...productSpecs);
      }

      // 批量创建所有规格
      await ProductSpec.bulkCreate(allNewSpecs);

      res.json({
        success: true,
        message: '规格已应用到所有商品',
        affectedProducts: productIds.length
      });
    } else {
      // 只更新当前商品的规格
      // 先删除旧的规格
      await ProductSpec.destroy({ where: { product_id: id } });

      // 批量创建新的规格
      const newSpecs = await ProductSpec.bulkCreate(
        specs.map(spec => ({
          product_id: id,
          type: spec.type,
          name: spec.name,
          price: spec.price || 0.00,
          is_required: spec.is_required || 0
        }))
      );

      res.json(newSpecs);
    }
  } catch (error) {
    console.error('Batch update product specs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductSpecs,
  createProductSpec,
  updateProductSpec,
  deleteProductSpec,
  batchUpdateProductSpecs
};