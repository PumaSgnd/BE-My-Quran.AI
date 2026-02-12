const db = require('../config/db');

// 🔹 Ambil semua last read milik user
const getLastRead = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(`
      SELECT 
        l.*, 
        s.name AS surah_name, 
        s.name_arabic, 
        s.name_translation_id AS surah_translation
      FROM last_read_multi l
      JOIN surahs s ON l.surah_id = s.id
      WHERE l.user_id = $1
      ORDER BY l.updated_at DESC
    `, [userId]);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error("Error di getLastRead:", error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 🔹 Ambil data buat tampilan "lanjut baca"
const getLastReadForBaca = async (req, res) => {
  const userId = req.user.id;
  try {
    const query = `
      SELECT 
        lr.updated_at,
        a.id AS ayah_id,
        a.ayah_number,
        a.verse_key,
        a.text AS text_ar,
        s.id AS surah_id,
        s.name AS surah_name,
        s.name_arabic AS surah_name_ar,
        s.name_simple AS surah_code,
        s.name_translation_id AS surah_translation
      FROM last_read_multi lr
      JOIN ayahs a ON lr.ayah_id = a.id
      JOIN surahs s ON lr.surah_id = s.id
      WHERE lr.user_id = $1
      ORDER BY lr.updated_at DESC;
    `;

    const { rows } = await db.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'success',
        message: 'Belum ada data terakhir dibaca.',
        data: null
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Data terakhir dibaca berhasil diambil.',
      data: rows
    });
  } catch (error) {
    console.error("Error di getLastReadForBaca:", error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error'
    });
  }
};

// 🔹 Tambah atau update (multi ayah)
const updateLastRead = async (req, res) => {
  const userId = req.user.id;
  const { surah_id, ayah_id, ayah_number, verse_key } = req.body;

  try {
    await db.query(`
      INSERT INTO last_read_multi 
      (user_id, surah_id, ayah_id, ayah_number, verse_key)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, surah_id, ayah_id)
      DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    `, [userId, surah_id, ayah_id, ayah_number, verse_key]);

    const activePlan = await db.query(`
      SELECT id FROM khatam_plan
      WHERE user_id=$1 AND status='active'
      LIMIT 1
    `, [userId]);


    if (activePlan.rows.length) {
      const khatamId = activePlan.rows[0].id;
      const juzResult = await db.query(`
        SELECT juz_number FROM ayahs WHERE id=$1
      `, [ayah_id]);

      const juzNumber = juzResult.rows[0]?.juz_number;

      if (juzNumber) {
        await db.query(`
          INSERT INTO khatam_progress
          (khatam_id, surah_id, ayah_id, juz)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (khatam_id, ayah_id) DO NOTHING
        `, [khatamId, surah_id, ayah_id, juzNumber]);

      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Last read ayat & progress khatam berhasil diperbarui.'
    });

  } catch (error) {
    console.error("Error di updateLastRead:", error);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error'
    });
  }
};

// 🔹 Hapus satu ayah dari last read
const deleteLastRead = async (req, res) => {
  const userId = req.user.id;
  const { surah_id, ayah_id } = req.body; // ⬅️ ambil dari body, bukan params

  try {
    await db.query(`
      DELETE FROM last_read_multi 
      WHERE user_id = $1 AND surah_id = $2 AND ayah_id = $3
    `, [userId, surah_id, ayah_id]);

    res.status(200).json({ status: 'success', message: 'Last read ayat berhasil dihapus.' });
  } catch (error) {
    console.error("Error di deleteLastRead:", error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

module.exports = { getLastRead, getLastReadForBaca, updateLastRead, deleteLastRead };
