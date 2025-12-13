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
            h.section,
            COALESCE(
                json_agg(
                json_build_object(
                    'grader', hg.name,
                    'grade', gr.name
                )
                ) FILTER (WHERE hg.id IS NOT NULL),
                '[]'
            ) AS grades
            FROM hadith h
            LEFT JOIN hadith_grade_relations hgr ON hgr.hadith_id = h.id
            LEFT JOIN hadith_graders hg ON hg.id = hgr.grader_id
            LEFT JOIN hadith_grades gr ON gr.id = hgr.grade_id
            WHERE h.id = $1
            GROUP BY h.id
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
