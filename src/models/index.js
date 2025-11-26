const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

// Load Models
const Ayah = require("./ayah")(sequelize, DataTypes);
const Surah = require("./surah")(sequelize, DataTypes);
const AyahViews = require("./ayahViews.model")(sequelize, DataTypes);
const Translation = require("./translation")(sequelize, DataTypes);

const PrayerTimesCache = require("./prayerTimesCache.model")(sequelize, DataTypes);
const UserPrayerPref = require("./userPrayerPref.model")(sequelize, DataTypes);

// === RELASI ===

// Surah → Ayah
Surah.hasMany(Ayah, { foreignKey: "surah_number" });
Ayah.belongsTo(Surah, { foreignKey: "surah_number" });

// Ayah → AyahViews
Ayah.hasOne(AyahViews, { foreignKey: "ayah_id" });
AyahViews.belongsTo(Ayah, { foreignKey: "ayah_id" });

Ayah.hasMany(Translation, { foreignKey: "ayah_id", as: "Translations" });
Translation.belongsTo(Ayah, { foreignKey: "ayah_id", as: "Ayah" });

module.exports = {
  sequelize,
  Ayah,
  Surah,
  AyahViews,
  Translation,
  PrayerTimesCache,
  UserPrayerPref,
};
