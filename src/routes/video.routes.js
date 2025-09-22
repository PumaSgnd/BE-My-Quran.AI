// src/routes/video.routes.js
const express = require('express');
const router = express.Router();
const { listVideos, syncNow } = require('../controllers/video.controller');

/**
 * @swagger
 * tags:
 *   - name: Videos
 *     description: Endpoint video (sumber YouTube, cached di PostgreSQL)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Channel:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Ustadz Adi Hidayat
 *     VideoItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 15
 *         youtube_video_id:
 *           type: string
 *           example: abcd1234XYZ
 *         title:
 *           type: string
 *           example: Tata Cara Shalat Sesuai Sunnah
 *         description:
 *           type: string
 *           example: Penjelasan lengkap tata cara shalat...
 *         thumbnails:
 *           type: object
 *           example:
 *             default:
 *               url: https://i.ytimg.com/vi/abcd1234XYZ/default.jpg
 *             medium:
 *               url: https://i.ytimg.com/vi/abcd1234XYZ/mqdefault.jpg
 *             high:
 *               url: https://i.ytimg.com/vi/abcd1234XYZ/hqdefault.jpg
 *         published_at:
 *           type: string
 *           format: date-time
 *           example: "2025-08-20T12:00:00.000Z"
 *         duration_iso:
 *           type: string
 *           example: PT25M10S
 *         stats:
 *           type: object
 *           properties:
 *             view_count:
 *               type: integer
 *               example: 12345
 *             like_count:
 *               type: integer
 *               example: 500
 *             comment_count:
 *               type: integer
 *               example: 120
 *         channel:
 *           $ref: '#/components/schemas/Channel'
 *         embed_url:
 *           type: string
 *           example: https://www.youtube.com/embed/abcd1234XYZ
 *     VideoListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         page:
 *           type: integer
 *           example: 1
 *         total:
 *           type: integer
 *           example: 120
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VideoItem'
 */

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Ambil daftar video (cached dari YouTube)
 *     description: >
 *       Sumber data diambil dari YouTube (UAH & Hanan) lalu disimpan di PostgreSQL.
 *       Gunakan `channel=uah` atau `channel=hanan` untuk filter cepat.
 *     tags:
 *       - Videos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           minimum: 1
 *           maximum: 50
 *       - in: query
 *         name: channel
 *         description: uah | hanan | id channel internal | nama channel
 *         schema:
 *           type: string
 *           example: uah
 *       - in: query
 *         name: q
 *         description: Pencarian judul (ILIKE)
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoListResponse'
 */
router.get('/', listVideos);

/**
 * @swagger
 * /videos/sync:
 *   post:
 *     summary: Sinkron data video dari YouTube ke database
 *     tags:
 *       - Videos
 *     responses:
 *       '200':
 *         description: Berhasil sinkron
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 synced:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       channel:
 *                         type: string
 *                         example: Ustadz Adi Hidayat
 *                       inserted_or_updated:
 *                         type: integer
 *                         example: 25
 */
router.post('/sync', syncNow);

module.exports = router;
