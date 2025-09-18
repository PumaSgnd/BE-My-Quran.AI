'use strict';
module.exports = (sequelize, DataTypes) => {
    const UserDailyCheckin = sequelize.define('UserDailyCheckin', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        user_id: DataTypes.INTEGER,
        checkin_date: DataTypes.DATEONLY,
        day_index: DataTypes.INTEGER,
        streak_count: DataTypes.INTEGER,
        reward_stars: DataTypes.INTEGER
    }, {
        tableName: 'user_daily_checkins',
        underscored: true
    });
    return UserDailyCheckin;
};
