module.exports = (sequelize, DataTypes) => {
    const AudioFile = sequelize.define('AudioFile', {
        id: { type: DataTypes.BIGINT, primaryKey: true },
        surah_id: DataTypes.INTEGER,
        reciter_id: DataTypes.INTEGER,
        audio_url: DataTypes.TEXT,
    }, { tableName: 'audio_files' });

    return AudioFile;
};
