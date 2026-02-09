module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('activities', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
      },
      daily_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      reward: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      prizes: {
        type: Sequelize.TEXT,
        allowNull: true
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('activities');
  }
};
