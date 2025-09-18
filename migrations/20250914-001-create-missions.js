'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('missions', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            code: { type: Sequelize.STRING, allowNull: false, unique: true },
            title: { type: Sequelize.STRING, allowNull: false },
            description: { type: Sequelize.TEXT },
            type: { type: Sequelize.ENUM('checkin', 'counter', 'boolean'), allowNull: false },
            period: { type: Sequelize.ENUM('daily', 'weekly', 'event'), allowNull: false },
            target_value: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            base_reward: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            milestone_rules: { type: Sequelize.JSONB },
            is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            active_from: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            active_to: { type: Sequelize.DATE },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
        });
        await queryInterface.addIndex('missions', ['is_active']);
        await queryInterface.addIndex('missions', ['period']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('missions');
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_missions_type";`);
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_missions_period";`);
    }
};
