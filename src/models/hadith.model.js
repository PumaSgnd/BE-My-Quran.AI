const pool = require('../config/db');

module.exports = {
    async findByBook(book) {
        const result = await pool.query(
            `SELECT id, book, number, arab, indo
             FROM hadiths
             WHERE book = $1
             ORDER BY number ASC`,
            [book]
        );
        return result.rows;
    },

    async findOne(book, number) {
        const result = await pool.query(
            `SELECT id, book, number, arab, indo
             FROM hadiths
             WHERE book = $1 AND number = $2
             LIMIT 1`,
            [book, number]
        );
        return result.rows[0];
    }
};
