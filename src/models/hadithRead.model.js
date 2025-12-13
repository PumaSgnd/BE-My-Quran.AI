const pool = require('../config/db');

module.exports = {
  async markAsRead(userId, hadithId) {
    await pool.query(
      `INSERT INTO hadith_reads (user_id, hadith_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, hadith_id) DO NOTHING`,
      [userId, hadithId]
    );
    return true;
  },

  async isRead(userId, hadithId) {
    const res = await pool.query(
      `SELECT 1 FROM hadith_reads
       WHERE user_id = $1 AND hadith_id = $2`,
      [userId, hadithId]
    );
    return res.rowCount > 0;
  },

  async deleteRead(userId, hadithId) {
    await pool.query(
      `DELETE FROM hadith_reads WHERE user_id = $1 AND hadith_id = $2`,
      [userId, hadithId]
    );
    return true;
  },

  async getAllForUser(userId) {
    const res = await pool.query(
      `SELECT hr.hadith_id, hr.read_at, h.indo AS nama, h.book_id
       FROM hadith_reads hr
       JOIN hadith h ON h.id = hr.hadith_id
       WHERE hr.user_id = $1
       ORDER BY hr.read_at DESC`,
      [userId]
    );
    return res.rows.map(r => ({
      hadith_id: r.hadith_id,
      read_at: r.read_at,
      nama: r.nama || '',
      book: r.book,
    }));
  },
};
