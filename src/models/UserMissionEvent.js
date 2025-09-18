'use strict';
module.exports = (sequelize, DataTypes) => {
    const UserMissionEvent = sequelize.define('UserMissionEvent', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: DataTypes.INTEGER,
        mission_id: DataTypes.UUID,
        event_code: DataTypes.STRING,
        amount: DataTypes.INTEGER,
        metadata: DataTypes.JSONB,
        occurred_at: DataTypes.DATE,
        idempotency_key: DataTypes.STRING,
        route: DataTypes.STRING
    }, {
        tableName: 'user_mission_events',
        underscored: true
    });
    return UserMissionEvent;
};
