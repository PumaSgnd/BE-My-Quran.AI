const express = require('express');
const router = express.Router();
const requireLogin = require('../middlewares/requireLogin.middleware');
const db = require('../models');
const { ActivitySession } = db;
const { DateTime } = require('luxon');

const ZONE = process.env.APP_TZ || 'Asia/Jakarta';
router.use(requireLogin);

/**
 * @swagger
 * tags:
 *   - name: Activity
 *     description: Session aktivitas (opsional anti-cheat)
 */

/**
 * @swagger
 * /activity/session:
 *   post:
 *     tags: [Activity]
 *     security: [ { cookieAuth: [] } ]
 *     summary: Buat activity session (read/audio/video) berlaku 30 menit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [read, audio, video]
 *                 example: read
 *             required: [type]
 *     responses:
 *       200: { description: OK }
 *       422: { description: Invalid type }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/session', async (req, res) => {
    try {
        const userId = req.user.id;
        const type = (req.body?.type || '').toLowerCase();
        if (!['read', 'audio', 'video'].includes(type)) {
            return res.status(422).json({ status: 'error', message: 'Invalid type' });
        }
        const expiresAt = DateTime.now().setZone(ZONE).plus({ minutes: 30 }).toJSDate();
        const row = await ActivitySession.create({ user_id: userId, type, is_active: true, expires_at: expiresAt });
        return res.json({ status: 'success', data: { session_id: row.id, expires_at: row.expires_at } });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: 'error', message: 'Internal error' });
    }
});

module.exports = router;
