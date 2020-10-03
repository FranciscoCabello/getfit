module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('userActs', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    actid: {
      type: Sequelize.INTEGER,
      references: {
        model: 'activities',
        key: 'id',
      },
    },
    userid: {
      type: Sequelize.INTEGER,
      references: {
        model: 'users',
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

  down: (queryInterface) => queryInterface.dropTable('userActs'),
};
