'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_mission_events', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            user_id: { type: Sequelize.INTEGER, allowNull: false },
            mission_id: { type: Sequelize.UUID },
            event_code: { type: Sequelize.STRING, allowNull: false },
            amount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            metadata: { type: Sequelize.JSONB },
            occurred_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            idempotency_key: { type: Sequelize.STRING, allowNull: false },
            route: { type: Sequelize.STRING }
        });
        await queryInterface.addConstraint('user_mission_events', {
            fields: ['user_id', 'idempotency_key'],
            type: 'unique',
            name: 'uniq_user_idem'
        });
        await queryInterface.addIndex('user_mission_events', ['user_id']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('user_mission_events');
    }
};
