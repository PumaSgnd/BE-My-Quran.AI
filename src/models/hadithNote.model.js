const pool = require('../config/db');

module.exports = {
    async getNote(hadithId) {
        const result = await pool.query(
            `SELECT id, hadith_id, note
             FROM hadith_notes
             WHERE hadith_id = $1
             LIMIT 1`,
            [hadithId]
        );
        return result.rows[0];
    },

    async saveNote(hadithId, note) {
        const result = await pool.query(
            `INSERT INTO hadith_notes (hadith_id, note)
             VALUES ($1, $2)
             ON CONFLICT (hadith_id)
             DO UPDATE SET note = EXCLUDED.note
             RETURNING id, hadith_id, note`,
            [hadithId, note]
        );
        return result.rows[0];
    }
};
