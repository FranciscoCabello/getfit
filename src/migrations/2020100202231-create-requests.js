module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('requests', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    tipo: {
      type: Sequelize.STRING,
    },
    comentario: {
      type: Sequelize.TEXT,
    },
    localId: {
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

  down: (queryInterface) => queryInterface.dropTable('requests'),
};