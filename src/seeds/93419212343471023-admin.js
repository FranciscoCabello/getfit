'use strict';

const bcrypt = require('bcrypt');

const PASSWORD_SALT = 10;

module.exports = {
  up: async(queryInterface, Sequelize) => {
    const usersArray = [];

    usersArray.push({
      name: 'GetfitAdmin',
      lastname: 'Zabaleta',
      password: await bcrypt.hash('12345678910', PASSWORD_SALT),
      email: 'getfit@gmail.com',
      phone: '+56966261252',
      photo: 'https://teleme.io/assets/feature_updates/tg_group_admins.jpg',
      admin: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return queryInterface.bulkInsert('users', usersArray);
  },

  down: async(queryInterface, Sequelize) => {
    /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */
  },
};
