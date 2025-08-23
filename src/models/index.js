// src/models/index.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Ayah = require('./ayah')(sequelize, DataTypes);
const Surah = require('./surah')(sequelize, DataTypes);
const Translation = require('./translation')(sequelize, DataTypes);
const AudioFile = require('./audioFile')(sequelize, DataTypes);
const Transliteration = require('./transliteration')(sequelize, DataTypes);
const TajwidVerse = require('./tajwidVerse')(sequelize, DataTypes);

// Relasi antar tabel
Ayah.belongsTo(Surah, { foreignKey: 'surah_number', targetKey: 'id' });
Surah.hasMany(Ayah, { foreignKey: 'surah_number', sourceKey: 'id' });

Ayah.hasMany(Translation, { foreignKey: 'ayah_id', sourceKey: 'id' });
Translation.belongsTo(Ayah, { foreignKey: 'ayah_id', targetKey: 'id' });

Surah.hasMany(AudioFile, { foreignKey: 'surah_id', sourceKey: 'id' });
AudioFile.belongsTo(Surah, { foreignKey: 'surah_id', targetKey: 'id' });

Ayah.hasOne(Transliteration, { foreignKey: 'ayah_id', sourceKey: 'id' });
Transliteration.belongsTo(Ayah, { foreignKey: 'ayah_id', targetKey: 'id' });

Ayah.hasOne(TajwidVerse, { foreignKey: 'ayah_id', sourceKey: 'id' });
TajwidVerse.belongsTo(Ayah, { foreignKey: 'ayah_id', targetKey: 'id' });

module.exports = {
    sequelize,
    Ayah,
    Surah,
    Translation,
    AudioFile,
    Transliteration,
    TajwidVerse,
};
