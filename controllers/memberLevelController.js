const { MemberLevel } = require('../models');

// 获取会员等级列表
const getMemberLevels = async (req, res) => {
  try {
    const { is_active } = req.query;
    
    const where = {};
    if (is_active !== undefined) where.is_active = is_active;
    
    const memberLevels = await MemberLevel.findAll({
      where,
      order: [['sort_order', 'ASC'], ['growth_required', 'ASC']]
    });
    
    res.json(memberLevels);
  } catch (error) {
    console.error('Get member levels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取会员等级详情
const getMemberLevelById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const memberLevel = await MemberLevel.findByPk(id);
    
    if (!memberLevel) {
      return res.status(404).json({ error: 'Member level not found' });
    }
    
    res.json(memberLevel);
  } catch (error) {
    console.error('Get member level by id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 创建会员等级
const createMemberLevel = async (req, res) => {
  try {
    const { name, level_id, growth_required, discount, icon, color, sort_order, is_active } = req.body;
    
    if (!name || !level_id || !growth_required) {
      return res.status(400).json({ error: 'Name, level_id and growth_required are required' });
    }
    
    // 检查level_id是否已存在
    const existingLevel = await MemberLevel.findOne({
      where: { level_id }
    });
    
    if (existingLevel) {
      return res.status(400).json({ error: 'Member level id already exists' });
    }
    
    const memberLevel = await MemberLevel.create({
      name,
      level_id,
      growth_required,
      discount: discount || 100.00,
      icon,
      color,
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : 1
    });
    
    res.status(201).json(memberLevel);
  } catch (error) {
    console.error('Create member level error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 更新会员等级
const updateMemberLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level_id, growth_required, discount, icon, color, sort_order, is_active } = req.body;
    
    const memberLevel = await MemberLevel.findByPk(id);
    
    if (!memberLevel) {
      return res.status(404).json({ error: 'Member level not found' });
    }
    
    // 检查level_id是否已被其他记录使用
    if (level_id && level_id !== memberLevel.level_id) {
      const existingLevel = await MemberLevel.findOne({
        where: { level_id, id: { [sequelize.Op.ne]: id } }
      });
      
      if (existingLevel) {
        return res.status(400).json({ error: 'Member level id already exists' });
      }
    }
    
    await memberLevel.update({
      name: name || memberLevel.name,
      level_id: level_id || memberLevel.level_id,
      growth_required: growth_required !== undefined ? growth_required : memberLevel.growth_required,
      discount: discount !== undefined ? discount : memberLevel.discount,
      icon: icon || memberLevel.icon,
      color: color || memberLevel.color,
      sort_order: sort_order !== undefined ? sort_order : memberLevel.sort_order,
      is_active: is_active !== undefined ? is_active : memberLevel.is_active
    });
    
    res.json(memberLevel);
  } catch (error) {
    console.error('Update member level error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 删除会员等级
const deleteMemberLevel = async (req, res) => {
  try {
    const { id } = req.params;
    
    const memberLevel = await MemberLevel.findByPk(id);
    
    if (!memberLevel) {
      return res.status(404).json({ error: 'Member level not found' });
    }
    
    await memberLevel.destroy();
    
    res.json({ message: 'Member level deleted successfully' });
  } catch (error) {
    console.error('Delete member level error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 初始化默认会员等级
const initDefaultMemberLevels = async () => {
  try {
    const memberLevelCount = await MemberLevel.count();
    
    if (memberLevelCount === 0) {
      // 默认会员等级列表
      const defaultLevels = [
        {
          name: '普通会员',
          level_id: 'normal',
          growth_required: 0,
          discount: 90.00,
          color: '#6B7280',
          sort_order: 1
        },
        {
          name: '银卡会员',
          level_id: 'silver',
          growth_required: 1000,
          discount: 88.00,
          color: '#A0A0A0',
          sort_order: 2
        },
        {
          name: '金卡会员',
          level_id: 'gold',
          growth_required: 5000,
          discount: 85.00,
          color: '#D4AF37',
          sort_order: 3
        },
        {
          name: '白金会员',
          level_id: 'platinum',
          growth_required: 10000,
          discount: 80.00,
          color: '#E5E4E1',
          sort_order: 4
        },
        {
          name: '钻石会员',
          level_id: 'diamond',
          growth_required: 20000,
          discount: 75.00,
          color: '#B9F2FF',
          sort_order: 5
        }
      ];
      
      // 批量创建默认会员等级
      await MemberLevel.bulkCreate(defaultLevels);
      console.log('默认会员等级创建成功！');
    }
  } catch (error) {
    console.error('初始化默认会员等级失败:', error);
  }
};

module.exports = {
  getMemberLevels,
  getMemberLevelById,
  createMemberLevel,
  updateMemberLevel,
  deleteMemberLevel,
  initDefaultMemberLevels
};