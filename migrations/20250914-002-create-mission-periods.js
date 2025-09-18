'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('mission_periods', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            mission_id: {
                type: Sequelize.UUID, allowNull: false,
                references: { model: 'missions', key: 'id' }, onDelete: 'CASCADE'
            },
            period_key: { type: Sequelize.STRING, allowNull: false },
            start_at: { type: Sequelize.DATE, allowNull: false },
            end_at: { type: Sequelize.DATE, allowNull: false }
        });
        await queryInterface.addConstraint('mission_periods', {
            fields: ['mission_id', 'period_key'],
            type: 'unique',
            name: 'uniq_mission_period_key'
        });
        await queryInterface.addIndex('mission_periods', ['mission_id']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('mission_periods');
    }
};
