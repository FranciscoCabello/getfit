module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('userlocals', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    userid: {
      type: Sequelize.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    localid: {
      type: Sequelize.INTEGER,
      references: {
        model: 'locals',
        key: 'id',
      },
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

  down: (queryInterface) => queryInterface.dropTable('userlocals'),
};
