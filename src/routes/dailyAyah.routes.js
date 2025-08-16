// src/routes/dailyAyah.routes.js
const express = require('express');
const router = express.Router();
const { getDailyAyah } = require('../controllers/dailyAyah.controller.js');

/**
 * @openapi
 * /daily-ayah:
 *   get:
 *     tags: [DailyAyah]
 *     summary: Ayat harian (random atau berdasarkan tanggal)
 *     description: |
 *       Mengambil satu ayat harian. Secara default acak, atau gunakan `date` (YYYY-MM-DD) untuk deterministik.
 *       Opsi `include` untuk memuat data tambahan seperti `translation`, `audio`, `latin`, `tajwid`.
 *     parameters:
 *       - in: query
 *         name: date
 *         description: Tanggal ayat harian (format YYYY-MM-DD). Jika tidak diisi → acak.
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-08-16"
 *       - in: query
 *         name: include
 *         description: "Daftar fitur tambahan (comma separated): translation,audio,latin,tajwid"
 *         schema:
 *           type: string
 *           example: "translation,audio,latin"
 *       - in: query
 *         name: lang
 *         description: Kode bahasa untuk terjemahan (jika include memuat `translation`).
 *         schema:
 *           type: string
 *           example: "id"
 *       - in: query
 *         name: reciter
 *         description: ID qari untuk audio (jika include memuat `audio`).
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2025-08-16"
 *                     surah:
 *                       type: object
 *                       properties:
 *                         id: { type: integer, example: 1 }
 *                         number: { type: integer, example: 1 }
 *                         name: { type: string, example: "Al-Fatihah" }
 *                     ayah:
 *                       $ref: '#/components/schemas/Ayah'
 *                     translation:
 *                       type: string
 *                       nullable: true
 *                       example: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang"
 *                     latin:
 *                       type: string
 *                       nullable: true
 *                       example: "bismi llāhi r-raḥmāni r-raḥīm"
 *                     audio_url:
 *                       type: string
 *                       format: uri
 *                       nullable: true
 *                       example: "https://cdn.example/qari/1/001001.mp3"
 *                     tajwid_spans:
 *                       type: array
 *                       nullable: true
 *                       items:
 *                         type: object
 *                         properties:
 *                           start: { type: integer, example: 7 }
 *                           end: { type: integer, example: 8 }
 *                           rule: { type: string, example: "ham_wasl" }
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   data:
 *                     date: "2025-08-16"
 *                     surah: { id: 1, number: 1, name: "Al-Fatihah" }
 *                     ayah:
 *                       id: 1
 *                       ayah_number: 1
 *                       verse_key: "1:1"
 *                       text_ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
 *                       tajwid_spans: []
 *                     translation: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang"
 *                     latin: "bismi llāhi r-raḥmāni r-raḥīm"
 *                     audio_url: "https://cdn.example/qari/1/001001.mp3"
 *                     tajwid_spans: []
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', getDailyAyah);

module.exports = router;
