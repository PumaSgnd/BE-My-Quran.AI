module.exports = (sequelize, DataTypes) => {
    const UserPrayerPref = sequelize.define('UserPrayerPref', {
        user_id: { type: DataTypes.UUID, primaryKey: true },
        method: { type: DataTypes.STRING, allowNull: false, defaultValue: 'MWL' },
        madhab: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Shafi' },
        hlr: { type: DataTypes.STRING, allowNull: false, defaultValue: 'MiddleOfTheNight' },
        offsets: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        adhan: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'user_prayer_prefs',
        timestamps: false,
    });

    return UserPrayerPref;
};
