// src/config/sequelize.js
const { Sequelize } = require('sequelize');

const {
  DATABASE_URL,
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  DB_SSL = 'false',
  NODE_ENV,
} = process.env;

const useSsl = String(DB_SSL).toLowerCase() === 'true';

const common = {
  dialect: 'postgres',
  logging: false,
  pool: { max: 5, min: 0, acquire: 20000, idle: 10000 },
  dialectOptions: useSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  define: { freezeTableName: true, timestamps: false },
};

let sequelize;

if (DATABASE_URL) {
  // Production / Railway / Supabase
  sequelize = new Sequelize(DATABASE_URL, common);
  console.log('✅ Sequelize pakai DATABASE_URL');
} else {
  // Local dev
  sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: Number(DB_PORT),
    ...common,
  });
  console.log('✅ Sequelize pakai config manual (localhost)');
}

module.exports = sequelize;
