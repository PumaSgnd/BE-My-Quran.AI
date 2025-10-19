const express = require('express');
const router = express.Router();
const db = require('../config/db');

const categoryMapping = {
  "Pagi & Petang": [
    "Bacaan Bila Kagum Terhadap Sesuatu",
    "Bacaan Terkait Adzan"
  ],
  "Shalat": [
    "Beberapa Doa Terkait Shalat",
    "Doa Berlindung Dari Empat Hal",
    "Doa Berlindung Dari Keburukan",
    "Doa Berlindung Dari Kecelakaan Dan Kematian Yang Mengerikan",
    "Doa Berlindung Dari Orang Zalim Dan Orang Kafir",
    "Doa Berlindung dari Setan",
    "Doa Berlindung Dari Syirik"
  ],
  "Memuji Allah": [
    "Doa Memohon Kebaikan Dan Berlindung Dari Keburukan",
    "Doa Memohon Ampun, Rahmat Dan Kebaikan Lainnya",
    "Doa Memohon Ilmu",
    "Doa Memohon Keteguhan Hati"
  ],
  "Haji & Umrah": [
    "Doa Perjalanan",
    "Doa Menghadapi Fenomena Alam"
  ],
  "Perjalanan": [
    "Doa Perjalanan",
    "Doa Perlindungan"
  ],
  "Kegembiraan & Kesulitan": [
    "Doa Saat Sedih dan Sulit",
    "Doa Saat Mendapat Kabar",
    "Doa Saat Sakit"
  ],
  "Alam": [
    "Doa Menghadapi Fenomena Alam"
  ],
  "Adab & Akhlak Baik": [
    "Beberapa Adab Dan Keutamaan",
    "Lafal Dzikir Dan Keutamaannya",
    "Istighfar Dan Taubat"
  ],
  "Rumah & Keluarga": [
    "Doa Keluar Dan Masuk Rumah",
    "Doa Kepada Anak Yang Baru Lahir",
    "Doa Terkait Istri Dan Anak",
    "Doa Terkait Orang Tua"
  ],
  "Makanan & Minuman": [
    "Doa Terkait Makan"
  ],
  "Sakit & Kematian": [
    "Doa Jenazah",
    "Doa untuk Orang Sakit"
  ]
};

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

router.get('/categories', async (req, res) => {
  try {
    // Ambil semua doa dari database
    const result = await db.query('SELECT grup FROM prayer');
    const allDoas = result.rows.map(r => r.grup);

    const categories = [];

    // "Semua"
    categories.push({
      title: "Semua",
      count: allDoas.length
    });

    // Mapping tiap kategori
    for (const [category, groups] of Object.entries(categoryMapping)) {
      // hitung jumlah doa yang masuk grup kategori ini
      const count = allDoas.filter(grup => groups.includes(grup)).length;

      categories.push({
        title: category,
        count
      });
    }

    res.json(categories);
  } catch (err) {
    console.error('❌ Error fetching categories:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/category/:title', async (req, res) => {
  const { title } = req.params;

  try {
    let result;

    if (title === "Semua") {
      // Ambil semua doa
      result = await db.query('SELECT * FROM prayer ORDER BY id ASC');
    } else {
      // cek kategori valid
      const groups = categoryMapping[title];
      if (!groups) {
        return res.status(404).json({ message: 'Kategori tidak ditemukan' });
      }

      // ambil semua doa yang grupnya ada di kategori ini
      result = await db.query(
        `SELECT * FROM prayer WHERE grup = ANY($1::text[]) ORDER BY id ASC`,
        [groups]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching doa by category:', err);
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
