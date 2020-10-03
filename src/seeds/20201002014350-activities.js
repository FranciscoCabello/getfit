'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    const activitiesArray = [];

    activitiesArray.push({
      name: 'Spinning',
      dificulty: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    activitiesArray.push({
      name: 'Zumba',
      dificulty: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    activitiesArray.push({
      name: 'Cardio Box',
      dificulty: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    activitiesArray.push({
      name: 'Yoga',
      dificulty: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return queryInterface.bulkInsert('activities', activitiesArray);
    
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
