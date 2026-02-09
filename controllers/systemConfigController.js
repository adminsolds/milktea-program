const { SystemConfig } = require('../models')

// 初始化默认系统配置
const initDefaultSystemConfigs = async (req, res) => {
  try {
    const defaultConfigs = [
      {
        key: 'growth_rate',
        value: JSON.stringify({
          rate: 1,  // 消费1元获得1成长值
          description: '成长值转换比例'
        }),
        description: '消费金额与成长值的转换比例(1元=X成长值)',
        category: 'member'
      },
      {
        key: 'points_rate',
        value: JSON.stringify({
          rate: 1,  // 消费1元获得1积分
          description: '积分转换比例'
        }),
        description: '消费金额与积分的转换比例(1元=X积分)',
        category: 'member'
      },
      {
        key: 'new_member_growth',
        value: JSON.stringify({
          amount: 100,  // 新人赠送100成长值
          description: '新人入会赠送成长值'
        }),
        description: '新人入会时赠送的成长值数量',
        category: 'member'
      },
      {
        key: 'new_member_points',
        value: JSON.stringify({
          amount: 0,  // 新人赠送0积分(成长值就是积分)
          description: '新人入会赠送积分'
        }),
        description: '新人入会时赠送的积分数量',
        category: 'member'
      }
    ]

    for (const config of defaultConfigs) {
      const [instance, created] = await SystemConfig.findOrCreate({
        where: { key: config.key },
        defaults: config
      })
      if (!created) {
        console.log(`配置 ${config.key} 已存在,跳过创建`)
      }
    }

    // 如果有res对象，返回响应，否则直接返回结果
    if (res) {
      res.json({
        success: true,
        message: '系统配置初始化成功'
      })
    } else {
      return { success: true, message: '系统配置初始化成功' }
    }
  } catch (error) {
    console.error('初始化系统配置失败:', error)
    // 如果有res对象，返回错误响应，否则只记录日志
    if (res) {
      res.status(500).json({
        success: false,
        message: '初始化系统配置失败',
        error: error.message
      })
    }
    throw error
  }
}

// 获取所有系统配置
const getSystemConfigs = async (req, res) => {
  try {
    const configs = await SystemConfig.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    })

    // 解析JSON格式的value
    const parsedConfigs = configs.map(config => ({
      ...config.toJSON(),
      value: JSON.parse(config.value)
    }))

    res.json({
      success: true,
      data: parsedConfigs
    })
  } catch (error) {
    console.error('获取系统配置失败:', error)
    res.status(500).json({
      success: false,
      message: '获取系统配置失败',
      error: error.message
    })
  }
}

// 获取单个配置
const getSystemConfig = async (req, res) => {
  try {
    const { key } = req.params

    const config = await SystemConfig.findOne({
      where: { key }
    })

    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      })
    }

    res.json({
      success: true,
      data: {
        ...config.toJSON(),
        value: JSON.parse(config.value)
      }
    })
  } catch (error) {
    console.error('获取配置失败:', error)
    res.status(500).json({
      success: false,
      message: '获取配置失败',
      error: error.message
    })
  }
}

// 更新配置
const updateSystemConfig = async (req, res) => {
  try {
    const { key } = req.params
    const { value } = req.body

    const config = await SystemConfig.findOne({
      where: { key }
    })

    if (!config) {
      return res.status(404).json({
        success: false,
        message: '配置不存在'
      })
    }

    // 将value转换为JSON字符串存储
    await config.update({
      value: JSON.stringify(value),
      update_time: new Date()
    })

    res.json({
      success: true,
      message: '配置更新成功',
      data: {
        ...config.toJSON(),
        value: JSON.parse(config.value)
      }
    })
  } catch (error) {
    console.error('更新配置失败:', error)
    res.status(500).json({
      success: false,
      message: '更新配置失败',
      error: error.message
    })
  }
}

// 批量更新配置
const batchUpdateSystemConfigs = async (req, res) => {
  try {
    const { configs } = req.body  // configs格式: [{ key: 'growth_rate', value: { rate: 2 } }, ...]

    if (!Array.isArray(configs)) {
      return res.status(400).json({
        success: false,
        message: '参数格式错误,configs必须是数组'
      })
    }

    const updatePromises = configs.map(async ({ key, value }) => {
      const config = await SystemConfig.findOne({
        where: { key }
      })

      if (config) {
        return config.update({
          value: JSON.stringify(value),
          update_time: new Date()
        })
      }

      return null
    })

    await Promise.all(updatePromises)

    res.json({
      success: true,
      message: '批量更新配置成功'
    })
  } catch (error) {
    console.error('批量更新配置失败:', error)
    res.status(500).json({
      success: false,
      message: '批量更新配置失败',
      error: error.message
    })
  }
}

module.exports = {
  initDefaultSystemConfigs,
  getSystemConfigs,
  getSystemConfig,
  updateSystemConfig,
  batchUpdateSystemConfigs
}
