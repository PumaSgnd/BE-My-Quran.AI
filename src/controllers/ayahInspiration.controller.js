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
                t.translation_text AS translation_text,
            FROM ayahs a
            JOIN ayah_images ai ON ai.ayah_id = a.id
            JOIN surahs s ON s.id = a.surah_number
            JOIN translations t ON t.ayah_id = a.id
            ORDER BY md5(a.id::text || CURRENT_DATE::text)
            LIMIT $1
        `;

        const values = [parseInt(limit) || 30];

        const { rows } = await db.query(query, values);

        return res.json({
            status: 'success',
            date: new Date().toISOString().slice(0,10),
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
