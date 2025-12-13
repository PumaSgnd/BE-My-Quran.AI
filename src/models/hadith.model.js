const pool = require('../config/db');

module.exports = {
    async findById(id) {
        const result = await pool.query(
            `SELECT h.id, h.book, h.number, h.arab, h.indo,
            c.id AS category_id, c.name AS category
     FROM hadith h
     LEFT JOIN categories c ON c.id = h.category_id
     WHERE h.id = $1
     LIMIT 1`,
            [id]
        );

        return result.rows[0];
    },

    async findByBook(book) {
        const result = await pool.query(
            `SELECT h.id, h.book, h.number, h.arab, h.indo,
            c.id AS category_id, c.name AS category
     FROM hadith h
     LEFT JOIN categories c ON c.id = h.category_id
     WHERE h.book = $1
     ORDER BY h.number NULLS LAST`,
            [book]
        );
        return result.rows;
    },

    async getCategoriesWithCount() {
        // Return array { title, count }
        const result = await pool.query(
            `SELECT book AS title, COUNT(*)::int AS count
       FROM hadith
       GROUP BY book
       ORDER BY count DESC`
        );
        return result.rows.map(r => ({ title: r.title, count: r.count }));
    },
};
