const pool = require('../config/db');

module.exports = {
    async markAsRead(hadithId) {
        await pool.query(
            `INSERT INTO hadith_reads (hadith_id)
             VALUES ($1)
             ON CONFLICT (hadith_id) DO NOTHING`,
            [hadithId]
        );
        return true;
    },

    async isRead(hadithId) {
        const res = await pool.query(
            `SELECT hadith_id FROM hadith_reads WHERE hadith_id = $1`,
            [hadithId]
        );
        return res.rowCount > 0;
    }
};
