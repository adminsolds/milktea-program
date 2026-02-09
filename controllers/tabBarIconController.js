const { TabBarIcon } = require('../models');

// 获取所有 TabBar 图标
const getTabBarIcons = async (req, res) => {
  try {
    const { is_active, page = 1, limit = 10 } = req.query;

    const where = {};
    if (is_active !== undefined) where.is_active = is_active;

    const offset = (page - 1) * limit;

    const { count, rows } = await TabBarIcon.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      tabBars: rows
    });
  } catch (error) {
    console.error('Get TabBar icons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取单个 TabBar 图标
const getTabBarIconById = async (req, res) => {
  try {
    const { id } = req.params;

    const tabBarIcon = await TabBarIcon.findByPk(id);

    if (!tabBarIcon) {
      return res.status(404).json({ error: 'TabBar icon not found' });
    }

    res.json(tabBarIcon);
  } catch (error) {
    console.error('Get TabBar icon by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建 TabBar 图标
const createTabBarIcon = async (req, res) => {
  try {
    const { page_path, text, icon_normal, icon_selected, sort_order, is_active } = req.body;

    // 验证必填字段
    if (!page_path || !text) {
      return res.status(400).json({ error: 'Page path and text are required' });
    }

    // 检查是否已存在相同 page_path 的记录
    const existingIcon = await TabBarIcon.findOne({ where: { page_path } });
    if (existingIcon) {
      return res.status(400).json({ error: 'TabBar icon with this page path already exists' });
    }

    const tabBarIcon = await TabBarIcon.create({
      page_path,
      text,
      icon_normal: icon_normal || null,
      icon_selected: icon_selected || null,
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : 1
    });

    res.status(201).json(tabBarIcon);
  } catch (error) {
    console.error('Create TabBar icon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新 TabBar 图标
const updateTabBarIcon = async (req, res) => {
  try {
    const { id } = req.params;
    const { page_path, text, icon_normal, icon_selected, sort_order, is_active } = req.body;

    const tabBarIcon = await TabBarIcon.findByPk(id);

    if (!tabBarIcon) {
      return res.status(404).json({ error: 'TabBar icon not found' });
    }

    // 如果要修改 page_path，检查是否与其他记录冲突
    if (page_path && page_path !== tabBarIcon.page_path) {
      const existingIcon = await TabBarIcon.findOne({ where: { page_path } });
      if (existingIcon) {
        return res.status(400).json({ error: 'TabBar icon with this page path already exists' });
      }
    }

    await tabBarIcon.update({
      page_path: page_path || tabBarIcon.page_path,
      text: text || tabBarIcon.text,
      icon_normal: icon_normal !== undefined ? icon_normal : tabBarIcon.icon_normal,
      icon_selected: icon_selected !== undefined ? icon_selected : tabBarIcon.icon_selected,
      sort_order: sort_order !== undefined ? sort_order : tabBarIcon.sort_order,
      is_active: is_active !== undefined ? is_active : tabBarIcon.is_active
    });

    res.json(tabBarIcon);
  } catch (error) {
    console.error('Update TabBar icon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除 TabBar 图标
const deleteTabBarIcon = async (req, res) => {
  try {
    const { id } = req.params;

    const tabBarIcon = await TabBarIcon.findByPk(id);

    if (!tabBarIcon) {
      return res.status(404).json({ error: 'TabBar icon not found' });
    }

    await tabBarIcon.destroy();

    res.json({ message: 'TabBar icon deleted successfully' });
  } catch (error) {
    console.error('Delete TabBar icon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 批量更新 TabBar 图标排序
const updateTabBarOrder = async (req, res) => {
  try {
    const { orders } = req.body; // 格式: [{id: 1, sort_order: 0}, {id: 2, sort_order: 1}]

    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: 'Orders must be an array' });
    }

    for (const item of orders) {
      const tabBarIcon = await TabBarIcon.findByPk(item.id);
      if (tabBarIcon) {
        await tabBarIcon.update({ sort_order: item.sort_order });
      }
    }

    res.json({ message: 'TabBar order updated successfully' });
  } catch (error) {
    console.error('Update TabBar order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTabBarIcons,
  getTabBarIconById,
  createTabBarIcon,
  updateTabBarIcon,
  deleteTabBarIcon,
  updateTabBarOrder
};
