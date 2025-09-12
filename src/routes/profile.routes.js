// src/routes/profile.routes.js
const express = require('express');
const router = express.Router();

const { isLoggedIn } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate');
const { updateProfileRules } = require('../validators/profile.validator');
const { getMyProfile, updateMyProfile } = require('../controllers/profile.controller');

/**
 * @openapi
 * /profile/me:
 *   get:
 *     tags: [Profile]
 *     summary: Ambil profil user yang sedang login
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Data profil user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @openapi
 * /profile:
 *   put:
 *     tags: [Profile]
 *     summary: Update profil user yang sedang login
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *                 example: "Sad Low (edited)"
 *               photo:
 *                 type: string
 *                 format: uri
 *                 example: "https://i.pravatar.cc/300?u=me"
 *     responses:
 *       200:
 *         description: Profil berhasil diupdate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/BadRequest'
 */

// GET /api/profile/me -> ambil profil user yang login
router.get('/me', isLoggedIn, getMyProfile);

// PUT /api/profile -> update display_name &/ photo
router.put('/', isLoggedIn, validate(updateProfileRules), updateMyProfile);

module.exports = router;
