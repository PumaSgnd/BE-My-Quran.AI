const pool = require('../config/db');

module.exports = {
    async findById(id) {
        const result = await pool.query(`
      SELECT id, book_id, number, arab, indo, section
      FROM hadith
      WHERE id = $1
      LIMIT 1
    `, [id]);

        return result.rows[0];
    },

    async findByBook(slug) {
        const result = await pool.query(`
      SELECT h.id, h.number, h.arab, h.indo, h.section
      FROM hadith h
      JOIN books b ON b.id = h.book_id
      WHERE b.slug = $1
      ORDER BY h.number
    `, [slug]);

        return result.rows;
    },

    async findByBookAndRange(slug, first, last) {
        const result = await pool.query(`
      SELECT h.id, h.number, h.arab, h.indo, h.section
      FROM hadith h
      JOIN books b ON b.id = h.book_id
      WHERE b.slug = $1
        AND h.number BETWEEN $2 AND $3
      ORDER BY h.number
    `, [slug, first, last]);

        return result.rows;
    },

    async getCategoriesWithCount() {
        const result = await pool.query(`
      SELECT b.id, b.slug, b.title, COUNT(h.id)::int AS count
      FROM books b
      LEFT JOIN hadith h ON h.book_id = b.id
      GROUP BY b.id, b.slug, b.title
      ORDER BY count DESC
    `);

        return result.rows;
    }
};
