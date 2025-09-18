'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_wallet', {
            user_id: { type: Sequelize.INTEGER, primaryKey: true },
            stars: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
        });

        await queryInterface.createTable('reward_ledger', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            user_id: { type: Sequelize.INTEGER, allowNull: false },
            source: { type: Sequelize.STRING, allowNull: false }, // checkin | mission_claim | convert | topup | ad_s2s
            source_ref: { type: Sequelize.STRING },
            points_change: { type: Sequelize.INTEGER, allowNull: false },
            balance_after: { type: Sequelize.INTEGER, allowNull: false },
            metadata: { type: Sequelize.JSONB },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
        });
        await queryInterface.addIndex('reward_ledger', ['user_id']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('reward_ledger');
        await queryInterface.dropTable('user_wallet');
    }
};
