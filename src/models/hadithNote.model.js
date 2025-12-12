const pool = require('../config/db');

module.exports = {
  async getNote(userId, hadithId) {
    const result = await pool.query(
      `SELECT id, user_id, hadith_id, note
       FROM hadith_notes
       WHERE user_id = $1 AND hadith_id = $2
       LIMIT 1`,
      [userId, hadithId]
    );
    return result.rows[0];
  },

  async saveNote(userId, hadithId, note) {
    const result = await pool.query(
      `INSERT INTO hadith_notes (user_id, hadith_id, note, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, hadith_id)
       DO UPDATE SET note = EXCLUDED.note, updated_at = NOW()
       RETURNING id, user_id, hadith_id, note`,
      [userId, hadithId, note]
    );
    return result.rows[0];
  },

  async deleteNote(userId, hadithId) {
    await pool.query(
      `DELETE FROM hadith_notes WHERE user_id = $1 AND hadith_id = $2`,
      [userId, hadithId]
    );
    return true;
  },

  async getAllForUser(userId) {
    const result = await pool.query(
      `SELECT hn.hadith_id, hn.note, h.indo AS nama, h.arab AS arab, h.book
       FROM hadith_notes hn
       JOIN hadiths h ON h.id = hn.hadith_id
       WHERE hn.user_id = $1
       ORDER BY hn.updated_at DESC`,
      [userId]
    );
    // provide nama field for frontend ease
    return result.rows.map(r => ({
      hadith_id: r.hadith_id,
      note: r.note,
      nama: r.nama || (r.arab ? r.arab.substring(0,80) : ''),
      book: r.book,
    }));
  },
};
