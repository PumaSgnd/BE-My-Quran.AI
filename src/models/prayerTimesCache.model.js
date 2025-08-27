module.exports = (sequelize, DataTypes) => {
    const PrayerTimesCache = sequelize.define('PrayerTimesCache', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        lat: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
        lng: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
        tz: { type: DataTypes.STRING, allowNull: false },
        date: { type: DataTypes.DATEONLY, allowNull: false },
        method: { type: DataTypes.STRING, allowNull: false },
        madhab: { type: DataTypes.STRING, allowNull: false },
        hlr: { type: DataTypes.STRING, allowNull: false },
        offsets: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        offsets_hash: { type: DataTypes.STRING, allowNull: false },
        result: { type: DataTypes.JSONB, allowNull: false },
        computed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        expires_at: { type: DataTypes.DATE, allowNull: false },
    }, {
        tableName: 'prayer_times_cache',
        timestamps: false,
    });

    return PrayerTimesCache;
};
