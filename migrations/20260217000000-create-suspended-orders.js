const { Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('suspended_orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      suspended_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '挂起单号'
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '店铺ID'
      },
      cart_data: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: '购物车数据（JSON格式）'
      },
      member_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '会员手机号'
      },
      order_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: 'dine_in',
        comment: '订单类型：dine_in-堂食，takeout-外带'
      },
      remark: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '备注'
      },
      is_restored: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否已恢复'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('suspended_orders', ['store_id']);
    await queryInterface.addIndex('suspended_orders', ['is_restored']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('suspended_orders');
  }
};
