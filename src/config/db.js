// src/config/db.js
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL belum diset di environment!");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('connect', () => {
  console.log('✅ Koneksi ke database berhasil!');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};
