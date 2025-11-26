const db = require('../config/db');

// ✅ GET semua catatan user
const getMyNotes = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    const { rows } = await db.query(
      `SELECT 
        n.id AS note_id,
        n.ayah_id,
        n.content,
        n.created_at,
        a.surah_number,
        a.ayah_number
       FROM notes n
       JOIN ayahs a ON n.ayah_id = a.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [userId]
    );

    return res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('getMyNotes error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ✅ POST tambah / update catatan (UPSERT)
const upsertNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { ayah_id, content } = req.body;

    if (!userId)
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    if (!ayah_id || !content)
      return res.status(400).json({
        status: 'error',
        message: 'ayah_id dan content wajib diisi'
      });

    const { rows } = await db.query(
      `INSERT INTO notes (user_id, ayah_id, content)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, ayah_id)
       DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
       RETURNING *`,
      [userId, ayah_id, content]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Catatan berhasil disimpan',
      data: rows[0],
    });
  } catch (err) {
    console.error('upsertNote error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ✅ DELETE catatan
const deleteNote = async (req, res) => {
  try {
    const userId = req.user?.id;
    const ayahId = parseInt(req.params.ayahId, 10);

    if (!userId)
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });

    if (!ayahId)
      return res.status(400).json({ status: 'error', message: 'ayahId tidak valid' });

    const { rowCount } = await db.query(
      'DELETE FROM notes WHERE user_id = $1 AND ayah_id = $2',
      [userId, ayahId]
    );

    if (rowCount === 0)
      return res.status(404).json({
        status: 'error',
        message: 'Catatan tidak ditemukan'
      });

    return res.json({
      status: 'success',
      message: 'Catatan berhasil dihapus'
    });
  } catch (err) {
    console.error('deleteNote error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

module.exports = { getMyNotes, upsertNote, deleteNote };
