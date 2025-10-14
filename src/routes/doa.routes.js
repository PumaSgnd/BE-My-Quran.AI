import express from "express";
import { Pool } from "pg";

const router = express.Router();

// 🔧 Konfigurasi koneksi ke PostgreSQL Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 📥 POST /api/doa/import
// Menerima array JSON dan insert ke tabel doa_doa
router.post("/import", async (req, res) => {
  const data = req.body; // array JSON dari client

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: "Data harus berupa array JSON" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const d of data) {
      await client.query(
        `INSERT INTO doa_doa (grup, nama, ar, tr, idn, tentang, tag)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [d.grup, d.nama, d.ar, d.tr, d.idn, d.tentang, d.tag]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "✅ Semua data doa berhasil diimport!" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Gagal mengimport data", detail: err.message });
  } finally {
    client.release();
  }
});

export default router;
