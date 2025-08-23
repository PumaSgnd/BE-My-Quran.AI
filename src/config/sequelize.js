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
} = process.env;

const useSsl = String(DB_SSL).toLowerCase() === 'true';

const common = {
    dialect: 'postgres',
    logging: false,
    pool: { max: 5, min: 0, acquire: 20000, idle: 10000 }, // kecil: hemat koneksi
    dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    define: { freezeTableName: true, timestamps: false },
};

const sequelize = DATABASE_URL
    ? new Sequelize(DATABASE_URL, common)
    : new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: Number(DB_PORT),
        ...common,
    });

module.exports = sequelize;
