'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_mission_progress', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            user_id: { type: Sequelize.INTEGER, allowNull: false },
            mission_period_id: {
                type: Sequelize.UUID, allowNull: false,
                references: { model: 'mission_periods', key: 'id' }, onDelete: 'CASCADE'
            },
            progress_value: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            status: { type: Sequelize.ENUM('in_progress', 'completed', 'claimed'), allowNull: false, defaultValue: 'in_progress' },
            last_event_at: { type: Sequelize.DATE }
        });
        await queryInterface.addConstraint('user_mission_progress', {
            fields: ['user_id', 'mission_period_id'],
            type: 'unique',
            name: 'uniq_user_period_progress'
        });
        await queryInterface.addIndex('user_mission_progress', ['user_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('user_mission_progress');
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_user_mission_progress_status";`);
    }
};
