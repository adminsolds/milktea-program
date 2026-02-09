const { sequelize } = require('./db');

/**
 * 执行查询的辅助函数
 */
const query = async (sql, params = []) => {
  try {
    const [results] = await sequelize.query(sql, {
      replacements: params,
      type: sequelize.QueryTypes.SELECT
    });
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * 执行插入/更新/删除操作的辅助函数
 */
const execute = async (sql, params = []) => {
  try {
    const [results] = await sequelize.query(sql, {
      replacements: params,
      type: sequelize.QueryTypes.INSERT
    });
    return results;
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  query,
  execute
};
