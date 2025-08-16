// src/routes/reciter.routes.js
const express = require('express');
const router = express.Router();
const { getAllReciters, getAudioFileForSurah } = require('../controllers/reciter.controller.js');

/**
 * @openapi
 * /reciters:
 *   get:
 *     tags: [Reciters]
 *     summary: Daftar semua Qari (reciters)
 *     description: Mengembalikan daftar reciter dari tabel `reciters`.
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
 *                       id: { type: integer, example: 1 }
 *                       name: { type: string, example: "Mishary Rashid Alafasy" }
 *                       style: { type: string, example: "Murattal" }
 *                       slug: { type: string, example: "alafasy" }
 *             examples:
 *               ok:
 *                 value:
 *                   status: "success"
 *                   data:
 *                     - { id: 1, name: "Mishary Rashid Alafasy", style: "Murattal", slug: "alafasy" }
 *                     - { id: 2, name: "Abdul Basit", style: "Mujawwad", slug: "abdul-basit" }
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', getAllReciters);

/**
 * @openapi
 * /reciters/{reciterId}/surahs/{surahId}:
 *   get:
 *     tags: [Reciters]
 *     summary: URL audio tilawah untuk satu surah oleh reciter tertentu
 *     description: |
 *       Mengambil `audio_url` dari tabel `audio_files` untuk kombinasi `reciter_id` dan `surah_id`.
 *     parameters:
 *       - in: path
 *         name: reciterId
 *         required: true
 *         schema: { type: integer, minimum: 1, example: 1 }
 *         description: ID reciter (qari)
 *       - in: path
 *         name: surahId
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 114, example: 114 }
 *         description: ID/Nomor surah (1–114)
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
 *                   properties:
 *                     audio_url:
 *                       type: string
 *                       format: uri
 *                       example: "https://cdn.example/audio/alafasy/114.mp3"
 *             examples:
 *               ok:
 *                 value:
 *                   status: "success"
 *                   data:
 *                     audio_url: "https://cdn.example/audio/alafasy/114.mp3"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:reciterId/surahs/:surahId', getAudioFileForSurah);

module.exports = router;
