const express = require('express');
const router = express.Router();
const db = require('../models');
const { UserMissionEvent } = db;
const requireLogin = require('../middlewares/requireLogin.middleware');
const idempotent = require('../middlewares/idempotency.middleware');
const { applyEvent } = require('../services/missionEngine.service');
const { validateAyahRange, countVersesInRange } = require('../services/qulRef.service');

router.use(requireLogin);

/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: Kirim event aktivitas user → progres misi otomatis.
 */

/**
 * @swagger
 * /events:
 *   post:
 *     tags: [Events]
 *     security:
 *       - cookieAuth: []
 *     summary: Kirim event aktivitas (baca/audio/video/iklan)
 *     description: >
 *       **Header wajib**: `Idempotency-Key` (string unik). Pilih salah satu skema body (sesuai jenis event).
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *         example: "read-2-1-10-56f3f5a2"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   code: { type: string, enum: [quran_read] }
 *                   surah: { type: integer, example: 2 }
 *                   ayah_start: { type: integer, example: 1 }
 *                   ayah_end: { type: integer, example: 10 }
 *                   read_seconds: { type: integer, example: 120 }
 *                 required: [code, surah, ayah_start, ayah_end]
 *               - type: object
 *                 properties:
 *                   code: { type: string, enum: [audio_listen] }
 *                   seconds: { type: integer, example: 300 }
 *                 required: [code, seconds]
 *               - type: object
 *                 properties:
 *                   code: { type: string, enum: [video_watch] }
 *                   seconds: { type: integer, example: 600 }
 *                   completed: { type: boolean, example: true }
 *                 required: [code]
 *               - type: object
 *                 properties:
 *                   code: { type: string, enum: [ad_rewarded] }
 *                   network: { type: string, example: "admob" }
 *                   impression_id: { type: string, example: "imp_123" }
 *                   s2s: { type: boolean, example: true }
 *                 required: [code]
 *           examples:
 *             quran_read:
 *               summary: Baca 10 ayat (2:1–10)
 *               value: { code: "quran_read", surah: 2, ayah_start: 1, ayah_end: 10, read_seconds: 120 }
 *             audio_listen:
 *               summary: Dengarkan audio 5 menit
 *               value: { code: "audio_listen", seconds: 300 }
 *             video_watch:
 *               summary: Tonton video selesai
 *               value: { code: "video_watch", seconds: 600, completed: true }
 *             ad_rewarded:
 *               summary: Rewarded ad selesai
 *               value: { code: "ad_rewarded", network: "admob", impression_id: "imp_123", s2s: true }
 *     responses:
 *       200:
 *         description: Event diterapkan ke misi terkait
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 appliedTo:
 *                   - { missionId: "daily_read_10_verses", progressBefore: 0, progressAfter: 10, status: "completed" }
 *                   - { missionId: "weekly_read_100_verses", progressBefore: 37, progressAfter: 47, status: "in_progress" }
 *       422:
 *         description: Payload tidak valid (mis. range ayat salah)
 *       428:
 *         description: Idempotency-Key missing
 *       401:
 *         description: Unauthorized
 */
router.post('/', idempotent('events'), async (req, res) => {
    try {
        const userId = req.user.id;
        const body = req.body || {};
        const event = { code: body.code };

        if (event.code === 'quran_read') {
            const s = Number(body.surah), a1 = Number(body.ayah_start), a2 = Number(body.ayah_end);
            if (!await validateAyahRange(s, a1, a2)) return res.status(422).json({ status: 'error', message: 'Invalid surah/ayah range' });
            event.surah = s; event.ayah_start = a1; event.ayah_end = a2;
            event.read_seconds = Number(body.read_seconds || 0);
            event.verses_count = await countVersesInRange(s, a1, a2);
        } else if (event.code === 'audio_listen') {
            event.seconds = Math.max(0, Number(body.seconds || 0));
        } else if (event.code === 'video_watch') {
            event.seconds = Math.max(0, Number(body.seconds || 0));
            event.completed = !!body.completed;
        } else if (event.code === 'ad_rewarded') {
            event.network = body.network || 'unknown';
            event.impression_id = body.impression_id || null;
            event.s2s = !!body.s2s;
        } else {
            return res.status(422).json({ status: 'error', message: 'Unsupported event code' });
        }

        await UserMissionEvent.create({
            user_id: userId, mission_id: null, event_code: event.code,
            amount: event.verses_count || event.seconds || (event.completed ? 1 : 0) || 1,
            metadata: event, idempotency_key: req.header('Idempotency-Key'), route: '/api/events'
        });

        const result = await applyEvent(userId, event);
        return res.json({ status: 'success', data: result });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: 'error', message: 'Internal error' });
    }
});

module.exports = router;
