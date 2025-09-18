'use strict';
module.exports = (sequelize, DataTypes) => {
    const RewardLedger = sequelize.define('RewardLedger', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: DataTypes.INTEGER,
        source: DataTypes.STRING,
        source_ref: DataTypes.STRING,
        points_change: DataTypes.INTEGER,
        balance_after: DataTypes.INTEGER,
        metadata: DataTypes.JSONB
    }, {
        tableName: 'reward_ledger',
        underscored: true
    });
    return RewardLedger;
};
