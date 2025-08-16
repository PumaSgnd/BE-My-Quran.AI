// src/routes/surah.routes.js

const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const { validate } = require('../middlewares/validate');
// Tambahkan getAyahsBySurahId ke dalam import
const { getAllSurahs, getSurahById, getAyahsBySurahId } = require('../controllers/surah.controller');

/**
 * @openapi
 * /surahs:
 *   get:
 *     tags: [Surah]
 *     summary: Daftar surah (paginated)
 *     description: |
 *       Mengambil daftar surah. Gunakan `all=true` untuk ambil semua tanpa paging.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, example: 1 }
 *         description: Halaman data (diabaikan jika `all=true`)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 200, example: 20 }
 *         description: Item per halaman (diabaikan jika `all=true`)
 *       - in: query
 *         name: all
 *         schema: { type: boolean, example: false }
 *         description: Jika `true`, kembalikan semua surah tanpa paging
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Surah'
 *             examples:
 *               paged:
 *                 summary: Contoh hasil paged
 *                 value:
 *                   status: success
 *                   meta: { page: 1, limit: 20, total: 114, totalPages: 6 }
 *                   data:
 *                     - { id: 1, number: 1, name: "Al-Fatihah", ayahs_count: 7 }
 *                     - { id: 2, number: 2, name: "Al-Baqarah", ayahs_count: 286 }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /surahs/{id}:
 *   get:
 *     tags: [Surah]
 *     summary: Detail surah
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1, example: 1 }
 *         description: ID/nomor surah (1–114)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data:
 *                   $ref: '#/components/schemas/Surah'
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   data:
 *                     id: 1
 *                     number: 1
 *                     name: "Al-Fatihah"
 *                     ayahs_count: 7
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /surahs/{id}/ayahs:
 *   get:
 *     tags: [Surah]
 *     summary: Daftar ayat dalam sebuah surah (paginated)
 *     description: |
 *       Mengambil daftar ayat untuk surah tertentu.
 *       Gunakan `page` dan `limit` untuk paging.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1, example: 2 }
 *         description: ID/nomor surah (1–114)
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, example: 1 }
 *         description: Halaman data
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 300, example: 20 }
 *         description: Jumlah item per halaman
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ayah'
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   meta: { page: 1, limit: 20, total: 286, totalPages: 15 }
 *                   data:
 *                     - { id: 1, ayah_number: 1, verse_key: "2:1", text_ar: "الم", tajwid_spans: [] }
 *                     - { id: 2, ayah_number: 2, verse_key: "2:2", text_ar: "ذَٰلِكَ الْكِتَابُ ...", tajwid_spans: [] }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */


// Rute untuk mendapatkan semua surah
router.get('/', getAllSurahs);

// Rute untuk mendapatkan satu surah dengan ID
router.get('/:id', getSurahById);

// --- RUTE BARU DI SINI ---
// Rute untuk mendapatkan semua ayat dari sebuah surah
router.get('/:id/ayahs',
    validate([
        param('id').isInt({ min: 1 }).toInt(),
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 300 }).toInt(),
        query('all').optional().isIn(['0', '1']),
    ]),
    getAyahsBySurahId
);

module.exports = router;
