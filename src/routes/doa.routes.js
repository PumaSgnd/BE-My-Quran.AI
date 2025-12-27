const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM prayer ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching doa:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        category AS title,
        COUNT(*)::int AS count
      FROM prayer
      GROUP BY category
      ORDER BY category ASC
    `);

    const total = await db.query(`SELECT COUNT(*)::int FROM prayer`);

    const categories = [
      {
        title: 'Semua',
        count: total.rows[0].count
      },
      ...result.rows
    ];

    res.json(categories);
  } catch (err) {
    console.error('❌ Error fetching categories:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/category/:category', async (req, res) => {
  const { category } = req.params;

  try {
    let result;

    if (category === 'Semua') {
      result = await db.query(
        'SELECT * FROM prayer ORDER BY id ASC'
      );
    } else {
      result = await db.query(
        'SELECT * FROM prayer WHERE category = $1 ORDER BY id ASC',
        [category]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching doa by category:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM prayer WHERE id = $1',
      [id]
    );

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
