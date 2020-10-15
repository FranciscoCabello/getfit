module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('products', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    name: {
      type: Sequelize.STRING,
    },
    precio: {
      type: Sequelize.INTEGER,
    },
    tipo: {
      type: Sequelize.STRING,
    },
    estado: {
      type: Sequelize.STRING,
    },
    foto: {
      type: Sequelize.STRING,
    },
    descripcion: {
      type: Sequelize.TEXT,
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

  down: (queryInterface) => queryInterface.dropTable('products'),
};
