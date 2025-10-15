const express = require('express');
const router = express.Router();
const db = require('../config/db');

// === GET semua doa ===
// GET /api/doa
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM prayer ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching doa:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// === GET doa berdasarkan grup ===
// GET /api/doa/grup/:grup
router.get('/grup/:grup', async (req, res) => {
  const { grup } = req.params;
  try {
    const result = await db.query('SELECT * FROM prayer WHERE grup = $1 ORDER BY id ASC', [grup]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Doa tidak ditemukan untuk grup ini' });
    }
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching doa by grup:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// === GET doa berdasarkan ID ===
// GET /api/doa/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM prayer WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Doa tidak ditemukan' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching doa by ID:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
