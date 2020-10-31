module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('ownerlocals', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    ownerid: {
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

  down: (queryInterface) => queryInterface.dropTable('ownerlocals'),
};
