// src/models/index.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

// ==== MODELS YANG SUDAH ADA ====
const Ayah = require('./ayah')(sequelize, DataTypes);
const Surah = require('./surah')(sequelize, DataTypes);
const Translation = require('./translation')(sequelize, DataTypes);
const AudioFile = require('./audioFile')(sequelize, DataTypes);
const Transliteration = require('./transliteration')(sequelize, DataTypes);
const TajwidVerse = require('./tajwidVerse')(sequelize, DataTypes);

const PrayerTimesCache = require('./prayerTimesCache.model')(sequelize, DataTypes);
const UserPrayerPref = require('./userPrayerPref.model')(sequelize, DataTypes);

// ==== MODELS BARU: VIDEO & CHANNEL ====
const Channel = require('./channel.model')(sequelize, DataTypes); // pastikan file: src/models/channel.model.js
const Video = require('./video.model')(sequelize, DataTypes);   // pastikan file: src/models/video.model.js

// ==== MODELS BARU: MISI & WALLET ====
const Mission = require('./Mission')(sequelize, DataTypes);
const MissionPeriod = require('./MissionPeriod')(sequelize, DataTypes);
const UserMissionProgress = require('./UserMissionProgress')(sequelize, DataTypes);
const UserMissionEvent = require('./UserMissionEvent')(sequelize, DataTypes);
const UserDailyCheckin = require('./UserDailyCheckin')(sequelize, DataTypes);
const UserWallet = require('./UserWallet')(sequelize, DataTypes);
const RewardLedger = require('./RewardLedger')(sequelize, DataTypes);
const IdempotencyKey = require('./IdempotencyKey')(sequelize, DataTypes);
const ActivitySession = require('./ActivitySession')(sequelize, DataTypes);

// =================== RELASI =================== //
// -- Relasi lama --
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

// -- Relasi baru untuk fitur Video --
Channel.hasMany(Video, { foreignKey: 'channel_id' });
Video.belongsTo(Channel, { foreignKey: 'channel_id' });

// -- Relasi baru untuk Misi --
Mission.hasMany(MissionPeriod, { foreignKey: 'mission_id' });
MissionPeriod.belongsTo(Mission, { foreignKey: 'mission_id' });

MissionPeriod.hasMany(UserMissionProgress, { foreignKey: 'mission_period_id' });
UserMissionProgress.belongsTo(MissionPeriod, { foreignKey: 'mission_period_id' });
// =================== EXPORT =================== //
module.exports = {
    sequelize,

    // existing
    Ayah,
    Surah,
    Translation,
    AudioFile,
    Transliteration,
    TajwidVerse,
    PrayerTimesCache,
    UserPrayerPref,

    // new
    Channel,
    Video,

    // new missions
    Mission,
    MissionPeriod,
    UserMissionProgress,
    UserMissionEvent,
    UserDailyCheckin,
    UserWallet,
    RewardLedger,
    IdempotencyKey,
    ActivitySession
};
