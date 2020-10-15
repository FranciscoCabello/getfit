module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('activities', 'horarioI', {
          type: Sequelize.DATE,
        }, { transaction: t }),
        queryInterface.addColumn('activities', 'horarioT', {
          type: Sequelize.DATE,
        }, { transaction: t }),
        queryInterface.addColumn('activities', 'capacity', {
          type: Sequelize.INTEGER,
        }, { transaction: t }),
      ]);
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
