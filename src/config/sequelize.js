// src/config/sequelize.js
const { Sequelize } = require('sequelize');

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error("❌ DATABASE_URL belum diset di environment!");
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: { max: 5, min: 0, acquire: 20000, idle: 10000 },
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }, // penting di Railway/Supabase
  },
  define: { freezeTableName: true, timestamps: false },
});

console.log('✅ Sequelize pakai DATABASE_URL');

module.exports = sequelize;
