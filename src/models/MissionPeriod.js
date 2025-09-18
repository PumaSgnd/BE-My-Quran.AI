'use strict';
module.exports = (sequelize, DataTypes) => {
    const MissionPeriod = sequelize.define('MissionPeriod', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        mission_id: DataTypes.UUID,
        period_key: DataTypes.STRING,
        start_at: DataTypes.DATE,
        end_at: DataTypes.DATE
    }, {
        tableName: 'mission_periods',
        underscored: true
    });

    MissionPeriod.associate = (models) => {
        MissionPeriod.belongsTo(models.Mission, { foreignKey: 'mission_id' });
        MissionPeriod.hasMany(models.UserMissionProgress, { foreignKey: 'mission_period_id' });
    };

    return MissionPeriod;
};
