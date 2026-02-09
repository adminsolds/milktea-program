const { Address, User } = require('../models');

// 获取用户地址列表
const getAddresses = async (req, res) => {
  try {
    const { openid } = req.query;
    console.log('获取地址列表请求, openid:', openid);

    if (!openid) {
      return res.status(400).json({
        success: false,
        message: '缺少openid参数'
      });
    }

    const addresses = await Address.findAll({
      where: { openid },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']]
    });

    console.log('查询到的地址列表:', addresses.length, '条');
    console.log('地址数据:', JSON.stringify(addresses, null, 2));

    res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('获取地址列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取地址列表失败'
    });
  }
};

// 获取单个地址详情
const getAddress = async (req, res) => {
  try {
    const { id, openid } = req.query;

    if (!id || !openid) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const address = await Address.findOne({
      where: { id, openid }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      });
    }

    res.json({
      success: true,
      address
    });
  } catch (error) {
    console.error('获取地址详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取地址详情失败'
    });
  }
};

// 添加新地址
const addAddress = async (req, res) => {
  try {
    const {
      openid,
      contact_name,
      contact_phone,
      province,
      city,
      district,
      detail_address,
      full_address,
      is_default = 0,
      tag
    } = req.body;

    console.log('添加地址请求数据:', req.body);

    if (!openid || !contact_name || !contact_phone || !province || !city || !district || !detail_address) {
      console.log('缺少必要参数:', { openid, contact_name, contact_phone, province, city, district, detail_address });
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 转换 is_default 为整数
    const isDefaultValue = parseInt(is_default) || 0;

    // 如果设置为默认地址，先取消该用户的其他默认地址
    if (isDefaultValue === 1) {
      await Address.update(
        { is_default: 0 },
        { where: { openid, is_default: 1 } }
      );
    }

    // 先查找用户获取user_id
    const User = require('../models').User;
    const user = await User.findOne({ where: { openid } });
    
    const address = await Address.create({
      user_id: user ? user.id : 0,
      openid,
      contact_name,
      contact_phone,
      province,
      city,
      district,
      detail_address,
      full_address: full_address || `${province}${city}${district}${detail_address}`,
      is_default: isDefaultValue,
      tag
    });
    
    console.log('地址创建成功:', address.id);

    res.json({
      success: true,
      message: '添加地址成功',
      address
    });
  } catch (error) {
    console.error('添加地址失败:', error);
    res.status(500).json({
      success: false,
      message: '添加地址失败'
    });
  }
};

// 编辑地址
const updateAddress = async (req, res) => {
  try {
    const { id, openid, contact_name, contact_phone, province, city, district, detail_address, full_address, is_default, tag } = req.body;

    if (!id || !openid) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const address = await Address.findOne({
      where: { id, openid }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      });
    }

    // 如果设置为默认地址，先取消该用户的其他默认地址
    if (is_default === 1) {
      await Address.update(
        { is_default: 0 },
        { where: { openid, is_default: 1, id: { [require('sequelize').Op.ne]: id } }
      }
      );
    }

    const updateData = {};
    if (contact_name) updateData.contact_name = contact_name;
    if (contact_phone) updateData.contact_phone = contact_phone;
    if (province) updateData.province = province;
    if (city) updateData.city = city;
    if (district) updateData.district = district;
    if (detail_address) updateData.detail_address = detail_address;
    if (full_address) updateData.full_address = full_address;
    if (is_default !== undefined) updateData.is_default = is_default;
    if (tag !== undefined) updateData.tag = tag;

    await address.update(updateData);

    res.json({
      success: true,
      message: '更新地址成功',
      address
    });
  } catch (error) {
    console.error('更新地址失败:', error);
    res.status(500).json({
      success: false,
      message: '更新地址失败'
    });
  }
};

// 删除地址
const deleteAddress = async (req, res) => {
  try {
    const { id, openid } = req.body;

    if (!id || !openid) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const address = await Address.findOne({
      where: { id, openid }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      });
    }

    await address.destroy();

    res.json({
      success: true,
      message: '删除地址成功'
    });
  } catch (error) {
    console.error('删除地址失败:', error);
    res.status(500).json({
      success: false,
      message: '删除地址失败'
    });
  }
};

// 设置默认地址
const setDefaultAddress = async (req, res) => {
  try {
    const { id, openid } = req.body;

    if (!id || !openid) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const address = await Address.findOne({
      where: { id, openid }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      });
    }

    // 取消该用户的所有默认地址
    await Address.update(
      { is_default: 0 },
      { where: { openid, is_default: 1 } }
    );

    // 设置新的默认地址
    await address.update({ is_default: 1 });

    res.json({
      success: true,
      message: '设置默认地址成功',
      address
    });
  } catch (error) {
    console.error('设置默认地址失败:', error);
    res.status(500).json({
      success: false,
      message: '设置默认地址失败'
    });
  }
};

module.exports = {
  getAddresses,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
