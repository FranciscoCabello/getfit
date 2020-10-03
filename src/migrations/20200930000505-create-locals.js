module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('locals', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    name: {
      type: Sequelize.STRING,
    },
    photo: {
      type: Sequelize.STRING,
    },
    ubicacion: {
      type: Sequelize.STRING,
    },
    horarioA: {
      type: Sequelize.STRING,
    },
    horarioC: {
      type: Sequelize.STRING,
    },
    precio: {
      type: Sequelize.INTEGER,
    },
    capacidad: {
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

  down: (queryInterface) => queryInterface.dropTable('locals'),
};
