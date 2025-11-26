module.exports = (sequelize, DataTypes) => {
    const Translation = sequelize.define('Translation', {
        id: { type: DataTypes.BIGINT, primaryKey: true },
        ayah_id: DataTypes.BIGINT,
        translation_text: DataTypes.TEXT,
        footnotes: DataTypes.TEXT,
        author_name: DataTypes.STRING,
        language_code: DataTypes.STRING,
    }, { tableName: 'translations', timestamps: false });

    return Translation;
};
