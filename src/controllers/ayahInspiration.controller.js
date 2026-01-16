const db = require('../config/db');

const getAyahInspiration = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;

    const query = `
      SELECT
        a.id,
        s.name AS surah_name,
        a.ayah_number,
        t.translation_text AS translation_text,
        i.image_url
      FROM ayahs a
      JOIN surahs s ON s.id = a.surah_id
      JOIN translations t ON t.ayah_id = a.id
      LEFT JOIN ayah_images i ON i.ayah_id = a.id
      ORDER BY md5(a.id::text || CURRENT_DATE::text)
      LIMIT $1
    `;

    const { rows } = await db.query(query, [limit]);

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
