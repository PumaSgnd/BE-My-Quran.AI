// config/config.js
require('dotenv').config();

const common = {
    dialect: 'postgres',
    logging: false,
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'sequelize',
    dialectOptions: String(process.env.DB_SSL || 'false').toLowerCase() === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {}
};

function envConf() {
    if (process.env.DATABASE_URL) return { ...common, url: process.env.DATABASE_URL };
    return {
        ...common,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'quran_db', // ⬅️ sesuai .env kamu
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432),
    };
}

module.exports = {
    development: envConf(),
    test: envConf(),
    production: envConf(),
};
