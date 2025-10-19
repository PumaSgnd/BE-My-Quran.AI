// src/models/index.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

// === HANYA MODEL UNTUK JADWAL SHALAT ===
const PrayerTimesCache = require('./prayerTimesCache.model')(sequelize, DataTypes);
const UserPrayerPref = require('./userPrayerPref.model')(sequelize, DataTypes);

// === EXPORT SEMUA MODEL YANG DIPAKAI ===
module.exports = {
  sequelize,
  PrayerTimesCache,
  UserPrayerPref
};