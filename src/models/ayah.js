module.exports = (sequelize, DataTypes) => {
    const Ayah = sequelize.define('Ayah', {
        id: { type: DataTypes.BIGINT, primaryKey: true },
        text: DataTypes.TEXT,
        ayah_number: DataTypes.INTEGER,
        verse_key: DataTypes.STRING,
        juz_number: DataTypes.INTEGER,
        surah_number: DataTypes.INTEGER,
    }, { tableName: 'ayahs' });

    return Ayah;
};
