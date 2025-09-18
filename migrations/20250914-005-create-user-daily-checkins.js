'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_daily_checkins', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            user_id: { type: Sequelize.INTEGER, allowNull: false },
            checkin_date: { type: Sequelize.DATEONLY, allowNull: false },
            day_index: { type: Sequelize.INTEGER, allowNull: false },
            streak_count: { type: Sequelize.INTEGER, allowNull: false },
            reward_stars: { type: Sequelize.INTEGER, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
        });
        await queryInterface.addConstraint('user_daily_checkins', {
            fields: ['user_id', 'checkin_date'],
            type: 'unique',
            name: 'uniq_user_checkin_date'
        });
        await queryInterface.addIndex('user_daily_checkins', ['user_id']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('user_daily_checkins');
    }
};
