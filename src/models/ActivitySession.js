'use strict';
module.exports = (sequelize, DataTypes) => {
    const ActivitySession = sequelize.define('ActivitySession', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: DataTypes.INTEGER,
        type: DataTypes.ENUM('read', 'audio', 'video'),
        is_active: DataTypes.BOOLEAN,
        expires_at: DataTypes.DATE
    }, {
        tableName: 'activity_sessions',
        underscored: true
    });
    return ActivitySession;
};
