const pool = require('../config/db');

module.exports = {
  async findById(id) {
    const result = await pool.query(
      `SELECT id, book, number, arab, indo
       FROM hadiths
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    return result.rows[0];
  },

  async findByBook(book) {
    const result = await pool.query(
      `SELECT id, book, number, arab, indo
       FROM hadiths
       WHERE book = $1
       ORDER BY number NULLS LAST`,
      [book]
    );
    return result.rows;
  },

  async getCategoriesWithCount() {
    // Return array { title, count }
    const result = await pool.query(
      `SELECT book AS title, COUNT(*)::int AS count
       FROM hadiths
       GROUP BY book
       ORDER BY count DESC`
    );
    return result.rows.map(r => ({ title: r.title, count: r.count }));
  },
};
