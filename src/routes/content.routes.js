// src/routes/content.routes.js
const express = require('express');
const router = express.Router();
const { getTemukanPageContent } = require('../controllers/content.controller.js');

/**
 * @openapi
 * /content/temukan:
 *   get:
 *     tags: [Content]
 *     summary: Konten halaman "Temukan"
 *     description: |
 *       Mengembalikan konten untuk halaman **Temukan** (discover/explore) yang dikonsumsi FE.
 *       Struktur `data` dapat bervariasi per kebutuhan UI (section dinamis), sehingga didokumentasikan sebagai objek bebas.
 *     parameters:
 *       - in: query
 *         name: lang
 *         description: Kode bahasa konten (jika multi-bahasa)
 *         schema:
 *           type: string
 *           example: "id"
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
 *                   type: object
 *                   description: Payload dinamis untuk menyusun halaman Temukan
 *                   additionalProperties: true
 *             examples:
 *               ok:
 *                 value:
 *                   status: "success"
 *                   data:
 *                     title: "Temukan"
 *                     sections:
 *                       - key: "featured_surahs"
 *                         title: "Surah Pilihan"
 *                         items:
 *                           - { id: 1, number: 1, name: "Al-Fatihah", ayahs_count: 7 }
 *                           - { id: 2, number: 2, name: "Al-Baqarah", ayahs_count: 286 }
 *                       - key: "topics"
 *                         title: "Topik Populer"
 *                         items:
 *                           - { slug: "shalat", title: "Shalat", count: 12 }
 *                           - { slug: "puasa", title: "Puasa", count: 8 }
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/temukan', getTemukanPageContent);

module.exports = router;
