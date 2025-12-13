const pool = require('../config/db');

module.exports = {
  async findBySlug(slug) {
    const result = await pool.query(`
      SELECT id, slug, title, sections
      FROM books
      WHERE slug = $1
      LIMIT 1
    `, [slug]);

    return result.rows[0];
  }
};
