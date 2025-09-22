'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('videos', 'category', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'Semua',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('videos', 'category');
  }
};
