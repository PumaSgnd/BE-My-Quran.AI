const db = require('../config/db');

const getAyahInspiration = async (req, res) => {
    try {
        const { limit } = req.query;

        let query = `
            SELECT
                a.id,
                a.surah_number,
                s.name AS surah_name,
                a.ayah_number,
                a.text,
                ai.image_url
            FROM ayahs a
            JOIN ayah_images ai ON ai.ayah_id = a.id
            JOIN surahs s ON s.id = a.surah_number
        `;

        const values = [];

        query += ' ORDER BY RANDOM()';

        if (limit) {
            query += ' LIMIT $1';
            values.push(parseInt(limit));
        } else {
            query += ' LIMIT 20';
        }

        const { rows } = await db.query(query, values);

        return res.json({
            status: 'success',
            total: rows.length,
            data: rows,
        });
    } catch (err) {
        console.error('getAyahInspiration error:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

module.exports = {
    getAyahInspiration,
};
