'use strict';
module.exports = (sequelize, DataTypes) => {
    const Mission = sequelize.define('Mission', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        code: { type: DataTypes.STRING, unique: true, allowNull: false },
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        type: DataTypes.ENUM('checkin', 'counter', 'boolean'),
        period: DataTypes.ENUM('daily', 'weekly', 'event'),
        target_value: DataTypes.INTEGER,
        base_reward: DataTypes.INTEGER,
        milestone_rules: DataTypes.JSONB,
        is_active: DataTypes.BOOLEAN,
        active_from: DataTypes.DATE,
        active_to: DataTypes.DATE
    }, {
        tableName: 'missions',
        underscored: true
    });

    Mission.associate = (models) => {
        Mission.hasMany(models.MissionPeriod, { foreignKey: 'mission_id' });
    };

    return Mission;
};
