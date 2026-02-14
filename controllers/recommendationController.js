const ProductRecommendation = require('../models/productRecommendation');
const Product = require('../models/product');

const getRecommendations = async (req, res) => {
  try {
    const { type, is_active } = req.query;
    const whereClause = {};

    if (type) {
      whereClause.type = type;
    }
    if (is_active !== undefined) {
      whereClause.is_active = is_active;
    }

    const recommendations = await ProductRecommendation.findAll({
      where: whereClause,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'image']
      }],
      order: [['sort_order', 'ASC'], ['id', 'DESC']]
    });

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    const recommendation = await ProductRecommendation.findByPk(id, {
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'image']
      }]
    });

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json(recommendation);
  } catch (error) {
    console.error('Get recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createRecommendation = async (req, res) => {
  try {
    const { type, title, image, product_id, link_type, link_url, sort_order, is_active } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (link_type === 'product' && !product_id) {
      return res.status(400).json({ error: 'Product ID is required when link type is product' });
    }

    const recommendation = await ProductRecommendation.create({
      type: type || 'new',
      title,
      image,
      product_id: link_type === 'product' ? product_id : null,
      link_type: link_type || 'product',
      link_url: link_type === 'custom' ? link_url : null,
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : 1
    });

    const result = await ProductRecommendation.findByPk(recommendation.id, {
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'image']
      }]
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, image, product_id, link_type, link_url, sort_order, is_active } = req.body;

    const recommendation = await ProductRecommendation.findByPk(id);

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    const updateData = {};
    
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (image !== undefined) updateData.image = image;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    if (link_type !== undefined) {
      updateData.link_type = link_type;
      if (link_type === 'product') {
        updateData.product_id = product_id || null;
        updateData.link_url = null;
      } else if (link_type === 'custom') {
        updateData.product_id = null;
        updateData.link_url = link_url || null;
      }
    }

    await recommendation.update(updateData);

    const result = await ProductRecommendation.findByPk(id, {
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'price', 'image']
      }]
    });

    res.json(result);
  } catch (error) {
    console.error('Update recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const recommendation = await ProductRecommendation.findByPk(id);

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    await recommendation.destroy();
    res.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    console.error('Delete recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const toggleRecommendationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const recommendation = await ProductRecommendation.findByPk(id);

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    await recommendation.update({
      is_active: recommendation.is_active ? 0 : 1
    });

    res.json(recommendation);
  } catch (error) {
    console.error('Toggle recommendation status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getRecommendations,
  getRecommendationById,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  toggleRecommendationStatus
};
