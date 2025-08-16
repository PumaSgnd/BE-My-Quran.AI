// src/routes/surahView.routes.js
const router = require('express').Router();
const { getSurahView } = require('../controllers/surahView.controller');

/**
 * @openapi
 * /surahs/{id}/view:
 *   get:
 *     tags: [Surah]
 *     summary: Tampilan ayat per surah (opsi render & include)
 *     description: |
 *       Mengambil ayat-ayat dalam satu surah dengan opsi tampilan dan data tambahan.
 *       
 *       **Opsi `include` (comma-separated):**
 *       - `translation` — sertakan terjemahan (sesuai `lang`)
 *       - `audio` — sertakan URL audio (sesuai `reciter`)
 *       - `user_state` — info state user (mis. apakah dibookmark) *(butuh sesi login, jika tidak login biasanya akan `null`)*
 *       - `tajwid` — sertakan span tajwid (bisa juga tersedia di dalam `ayah.tajwid_spans`)
 *       - `latin` — sertakan teks latin/transliterasi (dikontrol oleh `latin_mode`)
 *       
 *       **Catatan**:
 *       - Endpoint ini **publik**; namun beberapa `include` (seperti `user_state`) bisa memerlukan sesi login agar data muncul lengkap.
 *       - Paging pakai `page` & `limit`. Jika controller kamu mendukung "ambil semua", tambahkan param `all=true` (opsional).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID/nomor surah (1–114)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 114
 *           example: 1
 *       - in: query
 *         name: page
 *         description: Halaman data (diabaikan jika pakai `all=true` pada implementasi yang mendukung)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         description: Jumlah item per halaman (diabaikan jika `all=true`)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 20
 *       - in: query
 *         name: include
 *         description: "Daftar fitur tambahan yang diload (comma separated): translation,audio,user_state,tajwid,latin"
 *         schema:
 *           type: string
 *           example: "translation,audio,tajwid,latin"
 *       - in: query
 *         name: lang
 *         description: Kode bahasa terjemahan (jika `include` memuat `translation`)
 *         schema:
 *           type: string
 *           example: "id"
 *       - in: query
 *         name: reciter
 *         description: ID qari untuk audio (jika `include` memuat `audio`)
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: sanitize
 *         description: Mode sanitasi teks
 *         schema:
 *           type: string
 *           enum: [none, plain]
 *           default: none
 *       - in: query
 *         name: footnotes
 *         description: Sertakan catatan kaki bila tersedia
 *         schema:
 *           type: string
 *           enum: ["", "array"]
 *           default: ""
 *       - in: query
 *         name: strip_eoa
 *         description: Pengendali tanda akhir ayat (۝)
 *         schema:
 *           type: string
 *           enum: ["0", "1", "replace"]
 *           default: "0"
 *       - in: query
 *         name: latin_mode
 *         description: "Format transliterasi latin. 'ui' = sudah dirapikan; 'raw' = mentahan dari Qul."
 *         schema:
 *           type: string
 *           enum: [ui, raw]
 *           default: ui
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
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ayah:
 *                         $ref: '#/components/schemas/Ayah'
 *                       translation:
 *                         type: string
 *                         nullable: true
 *                         description: Teks terjemahan (muncul jika `include` memuat `translation`)
 *                         example: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang"
 *                       latin:
 *                         type: string
 *                         nullable: true
 *                         description: Teks latin/transliterasi (muncul jika `include` memuat `latin`)
 *                         example: "bismi llāhi r-raḥmāni r-raḥīm"
 *                       audio_url:
 *                         type: string
 *                         format: uri
 *                         nullable: true
 *                         description: URL audio tilawah (muncul jika `include` memuat `audio`)
 *                         example: "https://cdn.example/qari/1/001001.mp3"
 *                       tajwid_spans:
 *                         type: array
 *                         nullable: true
 *                         description: Span tajwid tambahan (muncul jika `include` memuat `tajwid`)
 *                         items:
 *                           type: object
 *                           properties:
 *                             start: { type: integer, example: 7 }
 *                             end: { type: integer, example: 8 }
 *                             rule: { type: string, example: "ham_wasl" }
 *                       user_state:
 *                         type: object
 *                         nullable: true
 *                         description: Info state user terkait ayat (muncul jika `include` memuat `user_state`)
 *                         additionalProperties: true
 *             examples:
 *               paged:
 *                 summary: Contoh hasil paged
 *                 value:
 *                   status: success
 *                   meta: { page: 1, limit: 20, total: 7, totalPages: 1 }
 *                   data:
 *                     - ayah:
 *                         id: 1
 *                         ayah_number: 1
 *                         verse_key: "1:1"
 *                         text_ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
 *                         tajwid_spans: []
 *                       translation: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang"
 *                       latin: "bismi llāhi r-raḥmāni r-raḥīm"
 *                       audio_url: "https://cdn.example/qari/1/001001.mp3"
 *                       tajwid_spans: []
 *                       user_state: null
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/view', getSurahView);

module.exports = router;
