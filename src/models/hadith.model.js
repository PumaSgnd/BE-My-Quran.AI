const pool = require('../config/db');

module.exports = {
    async findById(id) {
        const result = await pool.query(`
            SELECT
            h.id AS hadith_id,
            h.book_id,
            h.number,
            h.arab,
            h.indo,
            json_agg(
                json_build_object(
                'grader', hg.name,
                'grade', g.name
                )
                ORDER BY hg.name
            ) AS grades
            FROM hadith h
            JOIN hadith_grade_relations hgr ON hgr.hadith_id = h.id
            JOIN hadith_graders hg          ON hg.id = hgr.grader_id
            JOIN hadith_grades g            ON g.id = hgr.grade_id
            WHERE h.id = 23851
            GROUP BY h.id;
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
