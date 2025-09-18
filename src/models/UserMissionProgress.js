'use strict';
module.exports = (sequelize, DataTypes) => {
    const UserMissionProgress = sequelize.define('UserMissionProgress', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: DataTypes.INTEGER,
        mission_period_id: DataTypes.UUID,
        progress_value: DataTypes.INTEGER,
        status: DataTypes.ENUM('in_progress', 'completed', 'claimed'),
        last_event_at: DataTypes.DATE
    }, {
        tableName: 'user_mission_progress',
        underscored: true
    });

    UserMissionProgress.associate = (models) => {
        UserMissionProgress.belongsTo(models.MissionPeriod, { foreignKey: 'mission_period_id' });
    };

    return UserMissionProgress;
};
