// src/routes/lastRead.routes.js
const express = require('express');
const router = express.Router();
const { getLastRead, getLastReadForBaca, updateLastRead, deleteLastRead } = require('../controllers/lastRead.controller.js');
const { isLoggedIn } = require('../middlewares/auth.middleware.js');

// Semua endpoint di file ini butuh login (cookie session OAuth)
router.use(isLoggedIn);

/**
 * @openapi
 * /last-read:
 *   get:
 *     tags: [LastRead]
 *     summary: Ambil posisi terakhir dibaca milik user (butuh login)
 *     description: |
 *       Mengembalikan data "terakhir dibaca" milik user aktif.
 *       **Note:** Controller kamu mengembalikan **404** kalau belum ada data.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: OK — data posisi terakhir dibaca
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated_at: { type: string, format: date-time, example: "2025-08-16T10:23:45.123Z" }
 *                     ayah_id: { type: integer, example: 12345 }
 *                     ayah_number: { type: integer, example: 255 }
 *                     verse_key: { type: string, example: "2:255" }
 *                     surah_id: { type: integer, example: 2 }
 *                     surah_name: { type: string, example: "Al-Baqarah" }
 *                     surah_translation: { type: string, example: "Sapi Betina" }
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   data:
 *                     updated_at: "2025-08-16T10:23:45.123Z"
 *                     ayah_id: 12345
 *                     ayah_number: 255
 *                     verse_key: "2:255"
 *                     surah_id: 2
 *                     surah_name: "Al-Baqarah"
 *                     surah_translation: "Sapi Betina"
 *       404:
 *         description: Belum ada data terakhir dibaca
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 message: { type: string, example: "Belum ada data terakhir dibaca." }
 *                 data: { type: "null" }
 *             examples:
 *               none:
 *                 value:
 *                   status: "success"
 *                   message: "Belum ada data terakhir dibaca."
 *                   data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', getLastRead);

/**
 * @openapi
 * /last-read:
 *   post:
 *     tags: [LastRead]
 *     summary: Perbarui posisi terakhir dibaca milik user (butuh login)
 *     description: |
 *       **Input yang DIBUTUHKAN: `ayah_id` (number).**
 *       
 *       > **Cara mendapatkan `ayah_id` (paling mudah):**
 *       > 1. Buka endpoint **Surah View**: `GET /surahs/{surahId}/view?page={ayahNumber}&limit=1`  
 *       > 2. Lihat responnya → ambil `data[0].ayah.id` → **itulah `ayah_id`**  
 *       >
 *       > **Contoh:** untuk *Al-Baqarah ayat 255* → `GET /surahs/2/view?page=255&limit=1` → `data[0].ayah.id`
 *       
 *       Alternatif lain:
 *       - Dari **Juz Ayahs**: `GET /juz/{juzNumber}/ayahs?page={...}&limit={...}` lalu ambil `data[i].id`
 *       
 *       Setelah dapat `ayah_id`, kirim ke endpoint ini sebagai JSON body.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ayah_id]
 *             properties:
 *               ayah_id:
 *                 type: integer
 *                 example: 12345
 *           examples:
 *             simple:
 *               summary: Contoh body minimal
 *               value: { "ayah_id": 12345 }
 *     responses:
 *       200:
 *         description: OK — posisi terakhir dibaca tersimpan/diupdate (UPSERT)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 message: { type: string, example: "Data terakhir dibaca berhasil diperbarui." }
 *                 data:
 *                   type: object
 *                   description: Baris dari tabel `last_read`
 *                   properties:
 *                     user_id: { type: integer, example: 1 }
 *                     ayah_id: { type: integer, example: 12345 }
 *                     updated_at: { type: string, format: date-time, example: "2025-08-16T10:25:00.000Z" }
 *             examples:
 *               ok:
 *                 value:
 *                   status: "success"
 *                   message: "Data terakhir dibaca berhasil diperbarui."
 *                   data:
 *                     user_id: 1
 *                     ayah_id: 12345
 *                     updated_at: "2025-08-16T10:25:00.000Z"
 *       400:
 *         description: Body tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "error" }
 *                 message: { type: string, example: "ayah_id wajib diisi." }
 *             examples:
 *               missing:
 *                 value: { status: "error", message: "ayah_id wajib diisi." }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/baca', getLastReadForBaca);

router.post('/', updateLastRead);

/**
 * @openapi
 * /last-read:
 *   delete:
 *     tags: [LastRead]
 *     summary: Hapus posisi terakhir dibaca milik user (butuh login)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: OK — data last-read dihapus (jika ada)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 message: { type: string, example: "Data terakhir dibaca berhasil dihapus (jika ada)." }
 *             examples:
 *               ok:
 *                 value: { status: "success", message: "Data terakhir dibaca berhasil dihapus (jika ada)." }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/', deleteLastRead);

module.exports = router;
