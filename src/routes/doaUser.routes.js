const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn } = require('../middleware/isLoggedIn');

// ============================
// 📖 1. READ STATUS
// ============================

// GET semua doa yang sudah dibaca oleh user (🔐)
router.get('/read', isLoggedIn, async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      'SELECT prayer_id, created_at FROM prayer_read WHERE user_id = $1',
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching read doa:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST tandai doa sebagai sudah dibaca (🔐)
router.post('/read', isLoggedIn, async (req, res) => {
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
});

// DELETE hapus status sudah dibaca (🔐)
router.delete('/read', isLoggedIn, async (req, res) => {
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
});

// ============================
// ❤️ 2. FAVORITE STATUS
// ============================

// GET daftar doa favorit user (🔐)
router.get('/favorite', isLoggedIn, async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT f.prayer_id, p.nama, p.grup, f.created_at
       FROM prayer_favorite f
       JOIN prayer p ON f.prayer_id = p.id
       WHERE f.user_id = $1`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching favorite doa:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST tambah doa ke favorit (🔐)
router.post('/favorite', isLoggedIn, async (req, res) => {
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
});

// DELETE hapus doa dari favorit (🔐)
router.delete('/favorite', isLoggedIn, async (req, res) => {
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
});

// ============================
// 📝 3. NOTE
// ============================

// GET semua note user (🔐)
router.get('/note', isLoggedIn, async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT n.id, n.prayer_id, n.note, n.updated_at, p.nama
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
});

// POST tambah atau update catatan (🔐)
router.post('/note', isLoggedIn, async (req, res) => {
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
});

// DELETE hapus catatan (🔐)
router.delete('/note', isLoggedIn, async (req, res) => {
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
});

module.exports = router;
