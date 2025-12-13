const pool = require('../config/db');

module.exports = {
    async findById(id) {
        const result = await pool.query(`
            SELECT 
            h.id, 
            h.book_id,
            h.number, 
            h.arab, 
            h.indo,
            c.id AS category_id, 
            c.name AS category
            FROM hadith h
            LEFT JOIN categories c ON c.id = h.category_id
            WHERE h.id = $1
            LIMIT 1
        `, [id]);
        return result.rows[0];
    },

    async findByBook(slug) {
        const result = await pool.query(`
            SELECT 
            h.id, 
            h.book_id,
            h.number, 
            h.arab, 
            h.indo,
            c.id AS category_id, 
            c.name AS category
            FROM hadith h
            JOIN books b ON b.id = h.book_id
            LEFT JOIN categories c ON c.id = h.category_id
            WHERE b.slug = $1
            ORDER BY h.number NULLS LAST
        `, [slug]);
        return result.rows;
    },

    async getCategoriesWithCount() {
        const result = await pool.query(`
            SELECT 
            b.id,
            b.slug,
            b.title,
            COUNT(h.id)::int AS count
            FROM hadith h
            JOIN books b ON b.id = h.book_id
            GROUP BY b.id, b.slug, b.title
            ORDER BY count DESC
        `);
        return result.rows;
    }
};
