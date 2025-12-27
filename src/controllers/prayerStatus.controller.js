const db = require('../config/db');

// ============================
// 📖 READ STATUS
// ============================

exports.getRead = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT r.prayer_id, p.judul, r.created_at
       FROM prayer_read r
       JOIN prayer p ON r.prayer_id = p.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching read doa:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.addRead = async (req, res) => {
  const { prayer_id } = req.body;
  const user_id = req.user.id;

  try {
    await db.query(
      `INSERT INTO prayer_read (user_id, prayer_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, prayer_id) DO NOTHING`,
      [user_id, prayer_id]
    );
    res.json({ message: '✅ Doa ditandai sebagai sudah dibaca' });
  } catch (err) {
    console.error('❌ Error adding read doa:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteRead = async (req, res) => {
  const { prayer_id } = req.body;
  const user_id = req.user.id;

  try {
    await db.query(
      'DELETE FROM prayer_read WHERE user_id = $1 AND prayer_id = $2',
      [user_id, prayer_id]
    );
    res.json({ message: '🗑️ Status baca dihapus' });
  } catch (err) {
    console.error('❌ Error deleting read doa:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ============================
// ❤️ FAVORITE STATUS
// ============================

exports.getFavorite = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT f.prayer_id, p.judul, f.created_at
       FROM prayer_favorite f
       JOIN prayer p ON f.prayer_id = p.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching favorite doa:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.addFavorite = async (req, res) => {
  const { prayer_id } = req.body;
  const user_id = req.user.id;

  try {
    await db.query(
      `INSERT INTO prayer_favorite (user_id, prayer_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, prayer_id) DO NOTHING`,
      [user_id, prayer_id]
    );
    res.json({ message: '✅ Doa ditambahkan ke favorit' });
  } catch (err) {
    console.error('❌ Error adding favorite doa:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteFavorite = async (req, res) => {
  const { prayer_id } = req.body;
  const user_id = req.user.id;

  try {
    await db.query(
      'DELETE FROM prayer_favorite WHERE user_id = $1 AND prayer_id = $2',
      [user_id, prayer_id]
    );
    res.json({ message: '🗑️ Doa dihapus dari favorit' });
  } catch (err) {
    console.error('❌ Error deleting favorite doa:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ============================
// 📝 NOTE
// ============================

exports.getNote = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT n.id, n.prayer_id, p.judul, n.note, n.updated_at
       FROM prayer_note n
       JOIN prayer p ON n.prayer_id = p.id
       WHERE n.user_id = $1
       ORDER BY n.updated_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching notes:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.addOrUpdateNote = async (req, res) => {
  const { prayer_id, note } = req.body;
  const user_id = req.user.id;

  try {
    await db.query(
      `INSERT INTO prayer_note (user_id, prayer_id, note)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, prayer_id)
       DO UPDATE SET note = EXCLUDED.note, updated_at = NOW()`,
      [user_id, prayer_id, note]
    );
    res.json({ message: '✅ Catatan disimpan' });
  } catch (err) {
    console.error('❌ Error saving note:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteNote = async (req, res) => {
  const { prayer_id } = req.body;
  const user_id = req.user.id;

  try {
    await db.query(
      'DELETE FROM prayer_note WHERE user_id = $1 AND prayer_id = $2',
      [user_id, prayer_id]
    );
    res.json({ message: '🗑️ Catatan dihapus' });
  } catch (err) {
    console.error('❌ Error deleting note:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
