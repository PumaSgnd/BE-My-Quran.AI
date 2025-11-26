module.exports = (sequelize, DataTypes) => {
    const Surah = sequelize.define('Surah', {
        id: { type: DataTypes.INTEGER, primaryKey: true },
        name_simple: DataTypes.STRING,
        name_translation_id: DataTypes.STRING,
    }, { tableName: 'surahs', timestamps: false });

    return Surah;
};
