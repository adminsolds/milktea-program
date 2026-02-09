const { GroupBuy, GroupBuyParticipant, User } = require('../models');

// 获取团购活动列表
const getGroupBuys = async (req, res) => {
  try {
    const { status, is_active, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (is_active !== undefined) where.is_active = is_active;

    const offset = (page - 1) * limit;

    const { count, rows } = await GroupBuy.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });

    // 解析JSON字段
    const groupBuys = rows.map(item => {
      const data = item.toJSON();
      if (data.images) data.images = JSON.parse(data.images);
      if (data.product_ids) data.product_ids = JSON.parse(data.product_ids);
      if (data.rules) data.rules = JSON.parse(data.rules);
      if (data.specs) data.specs = JSON.parse(data.specs);
      return data;
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      groupBuys
    });
  } catch (error) {
    console.error('Get groupBuys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取团购活动详情
const getGroupBuyById = async (req, res) => {
  try {
    const { id } = req.params;

    const groupBuy = await GroupBuy.findByPk(id, {
      include: [
        {
          model: GroupBuyParticipant,
          as: 'participants',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'nickname', 'avatar_url']
            }
          ]
        }
      ]
    });

    if (!groupBuy) {
      return res.status(404).json({ error: 'GroupBuy not found' });
    }

    const data = groupBuy.toJSON();
    if (data.images) data.images = JSON.parse(data.images);
    if (data.product_ids) data.product_ids = JSON.parse(data.product_ids);
    if (data.rules) data.rules = JSON.parse(data.rules);
    if (data.specs) data.specs = JSON.parse(data.specs);

    res.json(data);
  } catch (error) {
    console.error('Get groupBuy by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建团购活动
const createGroupBuy = async (req, res) => {
  try {
    const {
      name,
      desc,
      image,
      images,
      product_ids,
      original_price,
      groupon_price,
      min_participants,
      max_participants,
      max_purchase,
      start_time,
      end_time,
      status,
      rules,
      specs,
      sort_order,
      is_active
    } = req.body;

    // 验证必填字段
    if (!name || !original_price || !groupon_price || !min_participants || !start_time || !end_time) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // 验证价格
    if (parseFloat(groupon_price) >= parseFloat(original_price)) {
      return res.status(400).json({ error: 'Groupon price must be less than original price' });
    }

    // 验证时间
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const groupBuy = await GroupBuy.create({
      name,
      desc,
      image,
      images: images ? JSON.stringify(images) : null,
      product_ids: product_ids ? JSON.stringify(product_ids) : null,
      original_price,
      groupon_price,
      min_participants,
      max_participants,
      max_purchase: max_purchase || 3,
      start_time,
      end_time,
      status: status || 'upcoming',
      rules: rules ? JSON.stringify(rules) : null,
      specs: specs ? JSON.stringify(specs) : null,
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : 1
    });

    res.status(201).json(groupBuy);
  } catch (error) {
    console.error('Create groupBuy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新团购活动
const updateGroupBuy = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      desc,
      image,
      images,
      product_ids,
      original_price,
      groupon_price,
      min_participants,
      max_participants,
      current_participants,
      max_purchase,
      start_time,
      end_time,
      status,
      sold,
      rules,
      specs,
      sort_order,
      is_active
    } = req.body;

    const groupBuy = await GroupBuy.findByPk(id);

    if (!groupBuy) {
      return res.status(404).json({ error: 'GroupBuy not found' });
    }

    // 验证价格（如果提供了新价格）
    if (groupon_price && original_price && parseFloat(groupon_price) >= parseFloat(original_price)) {
      return res.status(400).json({ error: 'Groupon price must be less than original price' });
    }

    // 验证时间
    if (start_time && end_time && new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    await groupBuy.update({
      name: name || groupBuy.name,
      desc: desc !== undefined ? desc : groupBuy.desc,
      image: image || groupBuy.image,
      images: images !== undefined ? JSON.stringify(images) : groupBuy.images,
      product_ids: product_ids !== undefined ? JSON.stringify(product_ids) : groupBuy.product_ids,
      original_price: original_price || groupBuy.original_price,
      groupon_price: groupon_price || groupBuy.groupon_price,
      min_participants: min_participants || groupBuy.min_participants,
      max_participants: max_participants !== undefined ? max_participants : groupBuy.max_participants,
      current_participants: current_participants !== undefined ? current_participants : groupBuy.current_participants,
      max_purchase: max_purchase !== undefined ? max_purchase : groupBuy.max_purchase,
      start_time: start_time || groupBuy.start_time,
      end_time: end_time || groupBuy.end_time,
      status: status || groupBuy.status,
      sold: sold !== undefined ? sold : groupBuy.sold,
      rules: rules !== undefined ? JSON.stringify(rules) : groupBuy.rules,
      specs: specs !== undefined ? JSON.stringify(specs) : groupBuy.specs,
      sort_order: sort_order !== undefined ? sort_order : groupBuy.sort_order,
      is_active: is_active !== undefined ? is_active : groupBuy.is_active
    });

    res.json(groupBuy);
  } catch (error) {
    console.error('Update groupBuy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除团购活动
const deleteGroupBuy = async (req, res) => {
  try {
    const { id } = req.params;

    const groupBuy = await GroupBuy.findByPk(id);

    if (!groupBuy) {
      return res.status(404).json({ error: 'GroupBuy not found' });
    }

    await groupBuy.destroy();

    res.json({ message: 'GroupBuy deleted successfully' });
  } catch (error) {
    console.error('Delete groupBuy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取团购参与者列表
const getGroupBuyParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await GroupBuyParticipant.findAndCountAll({
      where: { group_buy_id: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar_url']
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['join_time', 'ASC']]
    });

    const participants = rows.map(item => {
      const data = item.toJSON();
      if (data.specs) data.specs = JSON.parse(data.specs);
      return data;
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      participants
    });
  } catch (error) {
    console.error('Get groupBuy participants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新团购状态（定时任务调用）
const updateGroupBuyStatus = async (req, res) => {
  try {
    const now = new Date();

    // 查找所有需要更新的团购活动
    const groupBuys = await GroupBuy.findAll({
      where: {
        status: ['upcoming', 'ongoing'],
        is_active: 1
      }
    });

    for (const groupBuy of groupBuys) {
      const startTime = new Date(groupBuy.start_time);
      const endTime = new Date(groupBuy.end_time);

      // 更新为进行中
      if (groupBuy.status === 'upcoming' && now >= startTime && now < endTime) {
        await groupBuy.update({ status: 'ongoing' });
      }

      // 更新为已结束
      if ((groupBuy.status === 'upcoming' || groupBuy.status === 'ongoing') && now >= endTime) {
        await groupBuy.update({ status: 'ended' });
      }
    }

    res.json({ message: 'GroupBuy status updated successfully' });
  } catch (error) {
    console.error('Update groupBuy status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getGroupBuys,
  getGroupBuyById,
  createGroupBuy,
  updateGroupBuy,
  deleteGroupBuy,
  getGroupBuyParticipants,
  updateGroupBuyStatus
};
