// src/config/sequelize.js
const { Sequelize } = require('sequelize');

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error("❌ DATABASE_URL belum diset di environment!");
}

// Tambahin sslmode di URL kalau belum ada (Railway butuh SSL)
let dbUrl = DATABASE_URL;
if (!dbUrl.includes("sslmode")) {
  dbUrl += (dbUrl.includes("?") ? "&" : "?") + "sslmode=require";
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  pool: { max: 5, min: 0, acquire: 20000, idle: 10000 },
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
})

sequelize.authenticate()
  .then(() => console.log("✅ Koneksi database berhasil"))
  .catch((err) => console.error("❌ Gagal konek DB:", err.message));

module.exports = sequelize;
