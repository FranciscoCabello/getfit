module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('banks', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    account: {
      type: Sequelize.STRING,
    },
    bank: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    name: {
      type: Sequelize.STRING,
    },
    rut: {
      type: Sequelize.STRING,
    },
    type: {
      type: Sequelize.STRING,
    },
    userId: {
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

  down: (queryInterface) => queryInterface.dropTable('banks'),
};
