'use strict';

module.exports = {
    up: async(queryInterface, Sequelize) => {
        /**
         * Add seed commands here.
         *
         * Example:
         * await queryInterface.bulkInsert('People', [{
         *   name: 'John Doe',
         *   isBetaMember: false
         * }], {});
         */
        const localsArray = [];

        localsArray.push({
            name: 'Sportlife',
            photo: 'https://www2.sportlife.cl/sites/default/files/styles/carrusel_de_sede/public/IMG_0652_0.jpg?itok=qDUB4Fte',
            ubicacion: 'Camino el Alba 9783',
            horarioA: '6:00',
            horarioC: '22:00',
            precio: 30000,
            capacidad: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        localsArray.push({
            name: 'O2',
            photo: 'https://media-exp1.licdn.com/dms/image/C561BAQEx9uYROjQ0aA/company-background_10000/0?e=2159024400&v=beta&t=EejfrcMQ9FOWdgcsemUr7r07fbd3T8WbWhdpJikbGIQ',
            ubicacion: 'Kennedy 2285',
            horarioA: '6:00',
            horarioC: '22:00',
            precio: 40000,
            capacidad: 80,
            createdAt: new Date(),
            updatedAt: new Date(),
        });



        return queryInterface.bulkInsert('locals', localsArray);
    },

    down: async(queryInterface, Sequelize) => {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */
    }
};