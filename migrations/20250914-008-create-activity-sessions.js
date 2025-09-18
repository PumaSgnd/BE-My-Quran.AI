'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('activity_sessions', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            user_id: { type: Sequelize.INTEGER, allowNull: false },
            type: { type: Sequelize.ENUM('read', 'audio', 'video'), allowNull: false },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            expires_at: { type: Sequelize.DATE, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
        });
        await queryInterface.addIndex('activity_sessions', ['user_id', 'type']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('activity_sessions');
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_activity_sessions_type";`);
    }
};
