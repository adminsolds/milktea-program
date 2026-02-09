'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'is_pos', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否为POS现场点单订单'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'is_pos');
  }
};
