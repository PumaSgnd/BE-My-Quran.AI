// src/routes/dailyAyah.routes.js
const express = require('express');
const router = express.Router();

const { getDailyAyah } = require('../controllers/dailyAyah.controller.js');
const dailyAyahQueryValidator = require('../middlewares/dailyAyah.middleware');

/**
 * @openapi
 * /daily-ayah:
 *   get:
 *     tags:
 *       - DailyAyah
 *     summary: Ayat harian (deterministik per tanggal)
 *     description: >
 *       Mengambil satu ayat harian. Default memakai tanggal hari ini (deterministik).
 *       Gunakan parameter "date" (YYYY-MM-DD) untuk menetapkan tanggal tertentu.
 *       Gunakan "include" untuk memuat data tambahan: translation, audio, latin, tajwid.
 *     parameters:
 *       - in: query
 *         name: date
 *         description: >
 *           Tanggal ayat harian (YYYY-MM-DD).
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-08-16"
 *       - in: query
 *         name: include
 *         description: >
 *           Daftar fitur tambahan (comma separated): translation,audio,latin,tajwid.
 *           Jika "tajwid" tidak disertakan, field "tajwid_spans" akan bernilai null.
 *         schema:
 *           type: string
 *           default: "translation,audio,latin,tajwid"
 *           example: "translation,audio,latin,tajwid"
 *       - in: query
 *         name: lang
 *         description: >
 *           Kode bahasa untuk terjemahan (jika include berisi translation).
 *         schema:
 *           type: string
 *           example: "id"
 *       - in: query
 *         name: reciter
 *         description: >
 *           ID qari untuk audio (jika include berisi audio).
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
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         number:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "Al-Fatihah"
 *                         translation:
 *                           type: string
 *                           example: "Pembukaan"
 *                     ayah:
 *                       type: object
 *                       properties:
 *                         id: { type: integer, example: 1 }
 *                         ayah_number: { type: integer, example: 1 }
 *                         verse_key: { type: string, example: "1:1" }
 *                         text_ar: { type: string, example: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" }
 *                         juz_number: { type: integer, example: 1 }
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
 *               withTajwid:
 *                 summary: Include memuat "tajwid" → tajwid_spans berupa array
 *                 value:
 *                   status: "success"
 *                   data:
 *                     date: "2025-08-16"
 *                     surah:
 *                       id: 1
 *                       number: 1
 *                       name: "Al-Fatihah"
 *                       translation: "Pembukaan"
 *                     ayah:
 *                       id: 1
 *                       ayah_number: 1
 *                       verse_key: "1:1"
 *                       text_ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
 *                       juz_number: 1
 *                     translation: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang"
 *                     latin: "bismi llāhi r-raḥmāni r-raḥīm"
 *                     audio_url: "https://cdn.example/qari/1/001001.mp3"
 *                     tajwid_spans:
 *                       - { start: 0, end: 2, rule: "ham_wasl" }
 *                       - { start: 5, end: 6, rule: "ikhfa" }
 *               withoutTajwid:
 *                 summary: Include tidak memuat "tajwid" → tajwid_spans = null
 *                 value:
 *                   status: "success"
 *                   data:
 *                     date: "2025-08-16"
 *                     surah:
 *                       id: 1
 *                       number: 1
 *                       name: "Al-Fatihah"
 *                       translation: "Pembukaan"
 *                     ayah:
 *                       id: 1
 *                       ayah_number: 1
 *                       verse_key: "1:1"
 *                       text_ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
 *                       juz_number: 1
 *                     translation: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang"
 *                     latin: "bismi llāhi r-raḥmāni r-raḥīm"
 *                     audio_url: "https://cdn.example/qari/1/001001.mp3"
 *                     tajwid_spans: null
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', dailyAyahQueryValidator, getDailyAyah);

module.exports = router;
