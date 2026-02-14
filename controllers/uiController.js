const { Banner, FunctionEntry, NewProduct, Product, SystemConfig } = require('../models');

// 轮播图相关控制器

// 获取轮播图列表
const getBanners = async (req, res) => {
  try {
    const { position, is_active, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (position) where.position = position;
    if (is_active !== undefined) where.is_active = is_active;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Banner.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    
    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      banners: rows
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取轮播图详情
const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    res.json(banner);
  } catch (error) {
    console.error('Get banner by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 辅助函数：确保图片URL是完整URL
// 辅助函数：确保图片URL是完整URL
function ensureFullUrl(url) {
  // 直接返回相对路径，让前端根据环境配置拼接完整URL
  return url;
}

// 创建轮播图
const createBanner = async (req, res) => {
  try {
    let { title, image, link, position, sort_order, is_active, start_time, end_time } = req.body;
    
    // 验证必填字段
    if (!title || !image) {
      return res.status(400).json({ error: 'Title and image are required' });
    }
    
    // 确保图片URL是完整URL
    image = ensureFullUrl(image);
    
    const banner = await Banner.create({
      title,
      image,
      link,
      position: position || 'home',
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : 1,
      start_time: start_time || new Date(),
      end_time: end_time || new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // 默认一年后过期
    });
    
    res.status(201).json(banner);
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新轮播图
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, image, link, position, sort_order, is_active, start_time, end_time } = req.body;
    
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    // 确保图片URL是完整URL（如果提供了新的图片URL）
    if (image) {
      image = ensureFullUrl(image);
    }
    
    await banner.update({
      title: title || banner.title,
      image: image || banner.image,
      link: link || banner.link,
      position: position || banner.position,
      sort_order: sort_order !== undefined ? sort_order : banner.sort_order,
      is_active: is_active !== undefined ? is_active : banner.is_active,
      start_time: start_time || banner.start_time,
      end_time: end_time || banner.end_time
    });
    
    res.json(banner);
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除轮播图
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    await banner.destroy();
    
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 功能入口相关控制器

// 获取功能入口列表
const getFunctionEntries = async (req, res) => {
  try {
    const { is_active, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (is_active !== undefined) where.is_active = is_active;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await FunctionEntry.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    
    // 添加日志，调试功能入口数据
    console.log('=== 获取功能入口列表 ===');
    console.log('查询条件:', { is_active, page, limit });
    console.log('返回数量:', rows.length);
    rows.forEach((entry, index) => {
      console.log(`功能入口${index + 1}:`, {
        id: entry.id,
        name: entry.name,
        type: entry.type,
        icon: entry.icon,
        is_active: entry.is_active
      });
    });
    console.log('========================');
    
    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      functionEntries: rows
    });
  } catch (error) {
    console.error('Get function entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取功能入口详情
const getFunctionEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const functionEntry = await FunctionEntry.findByPk(id);
    
    if (!functionEntry) {
      return res.status(404).json({ error: 'Function entry not found' });
    }
    
    res.json(functionEntry);
  } catch (error) {
    console.error('Get function entry by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建功能入口
const createFunctionEntry = async (req, res) => {
  try {
    let { name, desc, type, icon, link, sort_order, is_active } = req.body;
    
    // 验证必填字段
    if (!name || !type || !icon) {
      return res.status(400).json({ error: 'Name, type and icon are required' });
    }
    
    // 确保图标URL是完整URL
    icon = ensureFullUrl(icon);
    
    const functionEntry = await FunctionEntry.create({
      name,
      desc,
      type,
      icon,
      link,
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : 1
    });
    
    res.status(201).json(functionEntry);
  } catch (error) {
    console.error('Create function entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新功能入口
const updateFunctionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, desc, type, icon, link, sort_order, is_active } = req.body;
    
    const functionEntry = await FunctionEntry.findByPk(id);
    
    if (!functionEntry) {
      return res.status(404).json({ error: 'Function entry not found' });
    }
    
    // 确保图标URL是完整URL（如果提供了新的图标URL）
    if (icon) {
      icon = ensureFullUrl(icon);
    }
    
    await functionEntry.update({
      name: name || functionEntry.name,
      desc: desc || functionEntry.desc,
      type: type || functionEntry.type,
      icon: icon || functionEntry.icon,
      link: link || functionEntry.link,
      sort_order: sort_order !== undefined ? sort_order : functionEntry.sort_order,
      is_active: is_active !== undefined ? is_active : functionEntry.is_active
    });
    
    res.json(functionEntry);
  } catch (error) {
    console.error('Update function entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除功能入口
const deleteFunctionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    
    const functionEntry = await FunctionEntry.findByPk(id);
    
    if (!functionEntry) {
      return res.status(404).json({ error: 'Function entry not found' });
    }
    
    await functionEntry.destroy();
    
    res.json({ message: 'Function entry deleted successfully' });
  } catch (error) {
    console.error('Delete function entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 新品推荐相关控制器

// 获取新品推荐列表
const getNewProducts = async (req, res) => {
  try {
    const { is_active, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (is_active !== undefined) where.is_active = is_active;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await NewProduct.findAndCountAll({
      where,
      include: [
        {
          model: Product,
          as: 'product'
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    // 将 Sequelize 实例转换为纯 JavaScript 对象
    const newProducts = rows.map(item => item.toJSON());

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      newProducts: newProducts
    });
  } catch (error) {
    console.error('Get new products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取新品推荐详情
const getNewProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const newProduct = await NewProduct.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product'
        }
      ]
    });
    
    if (!newProduct) {
      return res.status(404).json({ error: 'New product not found' });
    }
    
    res.json(newProduct);
  } catch (error) {
    console.error('Get new product by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建新品推荐
const createNewProduct = async (req, res) => {
  try {
    const { product_id, marketing_image, sort_order, is_active } = req.body;
    
    // 验证必填字段
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // 检查商品是否存在
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // 检查是否已添加过该商品
    const existingNewProduct = await NewProduct.findOne({ where: { product_id } });
    if (existingNewProduct) {
      return res.status(400).json({ error: 'Product already in new products list' });
    }
    
    const newProduct = await NewProduct.create({
      product_id,
      marketing_image: marketing_image || null,
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : 1
    });
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create new product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新新品推荐
const updateNewProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { marketing_image, sort_order, is_active } = req.body;
    
    const newProduct = await NewProduct.findByPk(id);
    
    if (!newProduct) {
      return res.status(404).json({ error: 'New product not found' });
    }
    
    const updateData = {};
    if (marketing_image !== undefined) updateData.marketing_image = marketing_image || null;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    await newProduct.update(updateData);
    
    res.json(newProduct);
  } catch (error) {
    console.error('Update new product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除新品推荐
const deleteNewProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const newProduct = await NewProduct.findByPk(id);
    
    if (!newProduct) {
      return res.status(404).json({ error: 'New product not found' });
    }
    
    await newProduct.destroy();
    
    res.json({ message: 'New product deleted successfully' });
  } catch (error) {
    console.error('Delete new product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 用户页面配置相关控制器

// 获取用户页面配置
const getUserPageConfig = async (req, res) => {
  try {
    const configs = await SystemConfig.findAll({
      where: {
        category: 'user_page'
      }
    });

    const configObj = {};
    configs.forEach(config => {
      try {
        configObj[config.key] = JSON.parse(config.value);
      } catch (e) {
        configObj[config.key] = config.value;
      }
    });

    res.json(configObj);
  } catch (error) {
    console.error('Get user page config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新用户页面配置
const updateUserPageConfig = async (req, res) => {
  try {
    const { header_bg_image, header_bg_color, header_bg_gradient } = req.body;

    const configs = [];

    if (header_bg_image !== undefined) {
      configs.push({
        key: 'header_bg_image',
        value: JSON.stringify(header_bg_image),
        description: '用户页面头部背景图片',
        category: 'user_page'
      });
    }

    if (header_bg_color !== undefined) {
      configs.push({
        key: 'header_bg_color',
        value: JSON.stringify(header_bg_color),
        description: '用户页面头部背景颜色',
        category: 'user_page'
      });
    }

    if (header_bg_gradient !== undefined) {
      configs.push({
        key: 'header_bg_gradient',
        value: JSON.stringify(header_bg_gradient),
        description: '用户页面头部背景渐变',
        category: 'user_page'
      });
    }

    // 使用 bulkCreate 或更新每个配置
    for (const config of configs) {
      await SystemConfig.upsert(config);
    }

    // 返回更新后的配置
    const allConfigs = await SystemConfig.findAll({
      where: {
        category: 'user_page'
      }
    });

    const configObj = {};
    allConfigs.forEach(config => {
      try {
        configObj[config.key] = JSON.parse(config.value);
      } catch (e) {
        configObj[config.key] = config.value;
      }
    });

    res.json({
      success: true,
      message: '配置更新成功',
      config: configObj
    });
  } catch (error) {
    console.error('Update user page config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== 主题配置相关 ====================

// 获取主题配置
const getThemeConfig = async (req, res) => {
  try {
    const configs = await SystemConfig.findAll({
      where: { category: 'theme' }
    });

    const configObj = {
      bg_color: '#FFF9E6' // 默认淡黄色
    };

    configs.forEach(config => {
      try {
        configObj[config.key] = JSON.parse(config.value);
      } catch (e) {
        configObj[config.key] = config.value;
      }
    });

    res.json(configObj);
  } catch (error) {
    console.error('Get theme config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新主题配置
const updateThemeConfig = async (req, res) => {
  try {
    const { bg_color } = req.body;

    const configs = [];

    if (bg_color !== undefined) {
      configs.push({
        key: 'bg_color',
        value: JSON.stringify(bg_color),
        description: '全局背景颜色',
        category: 'theme'
      });
    }

    for (const config of configs) {
      await SystemConfig.upsert(config);
    }

    // 返回更新后的配置
    const allConfigs = await SystemConfig.findAll({
      where: {
        category: 'theme'
      }
    });

    const configObj = {
      bg_color: '#FFF9E6'
    };
    allConfigs.forEach(config => {
      try {
        configObj[config.key] = JSON.parse(config.value);
      } catch (e) {
        configObj[config.key] = config.value;
      }
    });

    res.json({
      success: true,
      message: '主题配置更新成功',
      config: configObj
    });
  } catch (error) {
    console.error('Update theme config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  // 轮播图相关
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,

  // 功能入口相关
  getFunctionEntries,
  getFunctionEntryById,
  createFunctionEntry,
  updateFunctionEntry,
  deleteFunctionEntry,

  // 新品推荐相关
  getNewProducts,
  getNewProductById,
  createNewProduct,
  updateNewProduct,
  deleteNewProduct,

  // 用户页面配置相关
  getUserPageConfig,
  updateUserPageConfig,

  // 主题配置相关
  getThemeConfig,
  updateThemeConfig
};