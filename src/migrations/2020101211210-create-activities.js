module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('activities', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    name: {
      type: Sequelize.STRING,
    },
    dificulty: {
      type: Sequelize.INTEGER,
    },
    localId: {
      type: Sequelize.INTEGER,
    },
    horarioI: {
      type: Sequelize.DATE,
    },
    horarioT: {
      type: Sequelize.DATE,
    },
    capacity: {
      type: Sequelize.INTEGER,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),

  down: (queryInterface) => queryInterface.dropTable('activities'),
};
