'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('idempotency_keys', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            user_id: { type: Sequelize.INTEGER, allowNull: false },
            key: { type: Sequelize.STRING, allowNull: false },
            route: { type: Sequelize.STRING, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
        });
        await queryInterface.addConstraint('idempotency_keys', {
            fields: ['user_id', 'key', 'route'],
            type: 'unique',
            name: 'uniq_user_key_route'
        });
        await queryInterface.addIndex('idempotency_keys', ['user_id']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('idempotency_keys');
    }
};
