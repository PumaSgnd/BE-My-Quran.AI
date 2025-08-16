// src/routes/juz.routes.js
const express = require('express');
const router = express.Router();
const { getAllJuz, getAyahsByJuzNumber } = require('../controllers/juz.controller.js');

/**
 * @openapi
 * /juz:
 *   get:
 *     tags: [Juz]
 *     summary: Daftar 30 Juz
 *     description: Mengembalikan daftar ringkas informasi setiap juz.
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       juz_number: { type: integer, example: 1 }
 *                       start: { type: string, example: "1:1", description: "Awal juz (verse_key)" }
 *                       end: { type: string, example: "2:141", description: "Akhir juz (verse_key)" }
 *                       ayahs_count: { type: integer, example: 148 }
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   data:
 *                     - { juz_number: 1, start: "1:1", end: "2:141", ayahs_count: 148 }
 *                     - { juz_number: 2, start: "2:142", end: "2:252", ayahs_count: 111 }
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', getAllJuz);

/**
 * @openapi
 * /juz/{juzNumber}/ayahs:
 *   get:
 *     tags: [Juz]
 *     summary: Daftar ayat dalam sebuah juz (paginated)
 *     parameters:
 *       - in: path
 *         name: juzNumber
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 30, example: 1 }
 *         description: Nomor juz (1–30)
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
 *                   meta: { page: 1, limit: 20, total: 148, totalPages: 8 }
 *                   data:
 *                     - { id: 1, ayah_number: 1, verse_key: "1:1", text_ar: "بِسْمِ اللَّهِ...", tajwid_spans: [] }
 *                     - { id: 2, ayah_number: 2, verse_key: "1:2", text_ar: "ٱلْحَمْدُ لِلَّهِ...", tajwid_spans: [] }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:juzNumber/ayahs', getAyahsByJuzNumber);

module.exports = router;
