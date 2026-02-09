const { Store } = require('../models');

// 获取店铺列表
const getStores = async (req, res) => {
  try {
    const { is_active, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (is_active !== undefined) where.is_active = is_active;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Store.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      stores: rows
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取店铺详情
const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const store = await Store.findByPk(id);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    res.json(store);
  } catch (error) {
    console.error('Get store by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建店铺
const createStore = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    
    // 验证必填字段
    if (!name || !address || !phone) {
      return res.status(400).json({ error: 'Name, address and phone are required' });
    }
    
    const store = await Store.create({
      name,
      address,
      phone
    });
    
    res.status(201).json(store);
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新店铺
const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, is_active } = req.body;
    
    const store = await Store.findByPk(id);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    await store.update({
      name: name || store.name,
      address: address || store.address,
      phone: phone || store.phone,
      is_active: is_active !== undefined ? is_active : store.is_active
    });
    
    res.json(store);
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除店铺
const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    await store.destroy();

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取店铺状态（供小程序调用）
const getStoreStatus = async (req, res) => {
  try {
    const { store_id } = req.query;

    const where = {};
    if (store_id) {
      where.id = store_id;
    }

    // 获取第一个店铺（如果没有指定店铺ID）
    const store = await Store.findOne({
      where,
      order: [['id', 'ASC']]
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // 检查当前时间是否在营业时间内
    let isOpen = store.is_open;
    let withinBusinessHours = true;

    if (store.open_time && store.close_time) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [openHour, openMin] = store.open_time.split(':').map(Number);
      const [closeHour, closeMin] = store.close_time.split(':').map(Number);
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      // 判断是否在营业时间内（支持跨天营业）
      if (closeMinutes > openMinutes) {
        // 正常情况：如 09:00 - 22:00
        withinBusinessHours = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      } else {
        // 跨天营业：如 12:00 - 次日 03:00
        // 营业时间从开店时间到次日闭店时间
        withinBusinessHours = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
      }

      // 只有在营业时间内且is_open为true时才营业
      isOpen = isOpen && withinBusinessHours;
    }

    res.json({
      is_open: isOpen,
      within_business_hours: withinBusinessHours,
      open_time: store.open_time,
      close_time: store.close_time,
      closed_message: store.closed_message || '店铺已打烊，请明天再来',
      store_id: store.id
    });
  } catch (error) {
    console.error('Get store status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新店铺营业状态
const updateStoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_open } = req.body;

    if (typeof is_open !== 'boolean') {
      return res.status(400).json({ error: 'is_open must be a boolean' });
    }

    const store = await Store.findByPk(id);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    await store.update({ is_open });

    res.json({
      success: true,
      is_open,
      message: is_open ? '店铺已开始营业' : '店铺已打烊'
    });
  } catch (error) {
    console.error('Update store status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新店铺营业时间
const updateStoreHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { open_time, close_time, closed_message } = req.body;

    const store = await Store.findByPk(id);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // 验证时间格式
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (open_time && !timeRegex.test(open_time)) {
      return res.status(400).json({ error: 'open_time格式错误，应为HH:mm格式' });
    }
    if (close_time && !timeRegex.test(close_time)) {
      return res.status(400).json({ error: 'close_time格式错误，应为HH:mm格式' });
    }

    await store.update({
      open_time: open_time || store.open_time,
      close_time: close_time || store.close_time,
      closed_message: closed_message || store.closed_message
    });

    res.json({
      success: true,
      message: '营业时间更新成功',
      store
    });
  } catch (error) {
    console.error('Update store hours error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getStores,
  getStoreById,
  getStoreStatus,
  updateStoreStatus,
  updateStoreHours,
  createStore,
  updateStore,
  deleteStore
};