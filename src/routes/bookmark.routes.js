const express = require('express');
const router = express.Router();
const { getMyBookmarks, addBookmark, deleteBookmark } = require('../controllers/bookmark.controller.js');
const { isLoggedIn } = require('../middlewares/auth.middleware.js');

// Semua endpoint butuh login
router.use(isLoggedIn);

/**
 * @openapi
 * /bookmarks:
 *   get:
 *     tags: [Bookmarks]
 *     summary: Ambil semua bookmark milik user login
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daftar bookmark
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bookmark'
 *       401:
 *         description: Belum login
 */
router.get('/', getMyBookmarks);

/**
 * @openapi
 * /bookmarks:
 *   post:
 *     tags: [Bookmarks]
 *     summary: Tambah bookmark untuk ayah tertentu
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
 *                 example: 1234
 *     responses:
 *       201:
 *         description: Bookmark dibuat
 *       409:
 *         description: Ayat sudah di-bookmark sebelumnya
 *       401:
 *         description: Belum login
 */
router.post('/', addBookmark);

/**
 * @openapi
 * /bookmarks/{bookmarkId}:
 *   delete:
 *     tags: [Bookmarks]
 *     summary: Hapus bookmark milik user login
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bookmarkId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 12
 *     responses:
 *       200:
 *         description: Berhasil dihapus
 *       404:
 *         description: Tidak ditemukan / bukan milik user
 *       401:
 *         description: Belum login
 */
router.delete('/:bookmarkId', deleteBookmark);

module.exports = router;
