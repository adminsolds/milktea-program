module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_activities', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      activity_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      prize: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    
    await queryInterface.addConstraint('user_activities', 'user_activities_user_id_foreign', {
      type: 'foreign key',
      name: 'user_activities_user_id_foreign',
      references: {
        table: 'users',
        field: 'id'
      },
      fields: ['user_id']
    });
    
    await queryInterface.addConstraint('user_activities', 'user_activities_activity_id_foreign', {
      type: 'foreign key',
      name: 'user_activities_activity_id_foreign',
      references: {
        table: 'activities',
        field: 'id'
      },
      fields: ['activity_id']
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_activities');
  }
};
