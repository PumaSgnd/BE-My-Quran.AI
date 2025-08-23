module.exports = (sequelize, DataTypes) => {
    const Transliteration = sequelize.define('Transliteration', {
        ayah_id: { type: DataTypes.BIGINT, primaryKey: true },
        verse_key: DataTypes.STRING,
        surah_number: DataTypes.INTEGER,
        ayah_number: DataTypes.INTEGER,
        text_raw: DataTypes.TEXT,
    }, { tableName: 'transliterations' });

    return Transliteration;
};
