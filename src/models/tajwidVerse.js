module.exports = (sequelize, DataTypes) => {
    const TajwidVerse = sequelize.define('TajwidVerse', {
        ayah_id: { type: DataTypes.BIGINT, primaryKey: true },
        markup: DataTypes.TEXT,
    }, { tableName: 'tajwid_verses' });

    return TajwidVerse;
};
