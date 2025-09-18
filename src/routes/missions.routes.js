const express = require('express');
const router = express.Router();
const db = require('../models');
const { Mission, MissionPeriod, UserMissionProgress, sequelize } = db;
const { getWallet } = require('../services/ledgerService.service');
const { getCheckinStatus, doCheckin } = require('../services/checkinService.service');
const { claimMission } = require('../services/missionEngine.service');
const requireLogin = require('../middlewares/requireLogin.middleware');
const idempotent = require('../middlewares/idempotency.middleware');

router.use(requireLogin);

/**
 * @swagger
 * tags:
 *   - name: Missions
 *     description: Endpoint misi (check-in harian, misi harian/mingguan, klaim reward). Semua POST membutuhkan header **Idempotency-Key**.
 */

/**
 * @swagger
 * /missions:
 *   get:
 *     tags: [Missions]
 *     security:
 *       - cookieAuth: []
 *     summary: Ambil daftar misi + saldo bintang
 *     description: >
 *       Wajib sudah **login** (cookie `connect.sid`). Respons berisi section `checkin`, `daily`, `weekly`, `specials` dan `wallet`.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 sections:
 *                   checkin:
 *                     today: { claimable: true, dayIndex: 3, streak: 3, rewardToday: 20 }
 *                     grid:
 *                       - { day: 1, reward: 10, status: "claimed" }
 *                       - { day: 2, reward: 10, status: "claimed" }
 *                       - { day: 3, reward: 15, status: "today" }
 *                   daily:
 *                     - { id: "daily_read_10_verses", title: "Baca 10 Ayat", target: 10, reward: 20, progress: 7, status: "in_progress" }
 *                   weekly:
 *                     - { id: "weekly_read_100_verses", title: "Baca 100 Ayat (mingguan)", target: 100, reward: 200, progress: 37, status: "in_progress" }
 *                   specials: []
 *                 wallet: { stars: 120 }
 *       401:
 *         description: Unauthorized (belum login)
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const missions = await Mission.findAll({ where: { is_active: true }, order: [['period', 'ASC'], ['code', 'ASC']] });

        const sections = { checkin: {}, daily: [], weekly: [], specials: [] };

        const checkin = missions.find(m => m.type === 'checkin');
        if (checkin) {
            const status = await sequelize.transaction(t => getCheckinStatus(userId, checkin, t));
            const rules = checkin.milestone_rules || { cycleDays: 28, dayRewards: {}, milestones: [7, 14, 21, 28] };
            const grid = [];
            for (let d = 1; d <= (rules.cycleDays || 28); d++) {
                grid.push({
                    day: d,
                    reward: rules.dayRewards?.[String(d)] ?? checkin.base_reward ?? 10,
                    status: d < status.dayIndex ? 'claimed' : (d === status.dayIndex && status.claimable ? 'today' : 'locked')
                });
            }
            sections.checkin = {
                today: { claimable: status.claimable, dayIndex: status.dayIndex, streak: status.streak, rewardToday: status.rewardToday },
                grid
            };
        }

        async function attachProgress(list) {
            const out = [];
            for (const m of list) {
                const mp = await MissionPeriod.findOne({ where: { mission_id: m.id }, order: [['start_at', 'DESC']] });
                let progress = 0, status = 'in_progress';
                if (mp) {
                    const pr = await UserMissionProgress.findOne({
                        where: { user_id: userId, mission_period_id: mp.id }, order: [['updated_at', 'DESC']]
                    });
                    if (pr) { progress = pr.progress_value; status = pr.status; }
                }
                out.push({ id: m.code, title: m.title, description: m.description, target: m.target_value, reward: m.base_reward, progress, status });
            }
            return out;
        }

        sections.daily = await attachProgress(missions.filter(m => m.period === 'daily' && m.type !== 'checkin'));
        sections.weekly = await attachProgress(missions.filter(m => m.period === 'weekly'));
        sections.specials = await attachProgress(missions.filter(m => m.period === 'event'));

        const wallet = await getWallet(userId);
        return res.json({ status: 'success', data: { sections, wallet } });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: 'error', message: 'Internal error' });
    }
});

/**
 * @swagger
 * /missions/checkin/status:
 *   get:
 *     tags: [Missions]
 *     security:
 *       - cookieAuth: []
 *     summary: Status check-in hari ini
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data: { claimable: true, dayIndex: 3, streak: 3, rewardToday: 20 }
 *       401:
 *         description: Unauthorized
 */
router.get('/checkin/status', async (req, res) => {
    try {
        const userId = req.user.id;
        const mission = await Mission.findOne({ where: { code: 'daily_checkin_28d', is_active: true } });
        if (!mission) return res.json({ status: 'success', data: { today: { claimable: false }, grid: [] } });
        const data = await sequelize.transaction(t => getCheckinStatus(userId, mission, t));
        return res.json({ status: 'success', data });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: 'error', message: 'Internal error' });
    }
});

/**
 * @swagger
 * /missions/checkin:
 *   post:
 *     tags: [Missions]
 *     security:
 *       - cookieAuth: []
 *     summary: Check-in harian (idempotent 1×/hari)
 *     description: >
 *       **Header wajib**: `Idempotency-Key`. Saran isi: `checkin-YYYY-MM-DD`.
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *         example: "checkin-2025-09-15"
 *     responses:
 *       200:
 *         description: Berhasil claim
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 claimed: true
 *                 dayIndex: 3
 *                 streak: 3
 *                 reward: { stars: 20, milestone: false }
 *                 wallet: { stars: 140 }
 *       409:
 *         description: Sudah check-in hari ini
 *       428:
 *         description: Idempotency-Key missing
 *       401:
 *         description: Unauthorized
 */
router.post('/checkin', idempotent('checkin'), async (req, res) => {
    try {
        const userId = req.user.id;
        const mission = await Mission.findOne({ where: { code: 'daily_checkin_28d', is_active: true } });
        if (!mission) return res.status(422).json({ status: 'error', message: 'Check-in mission not found' });

        const result = await doCheckin(userId, mission, async (...args) => {
            const { addStars } = require('../services/ledgerService.service');
            return addStars(...args);
        });

        if (result.already) return res.status(409).json({ status: 'error', message: 'Already checked in today' });
        return res.json({ status: 'success', data: result });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: 'error', message: 'Internal error' });
    }
});

/**
 * @swagger
 * /missions/{missionId}/claim:
 *   post:
 *     tags: [Missions]
 *     security:
 *       - cookieAuth: []
 *     summary: Klaim reward misi
 *     description: >
 *       **Header wajib**: `Idempotency-Key`. Saran isi: `claim-<missionId>-<uuid>`.
 *     parameters:
 *       - in: path
 *         name: missionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "daily_read_10_verses"
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *         example: "claim-daily_read_10_verses-6b2c8d9f"
 *     responses:
 *       200:
 *         description: Berhasil klaim
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 missionId: "daily_read_10_verses"
 *                 reward: { stars: 20 }
 *                 wallet: { stars: 160 }
 *       409:
 *         description: Already claimed
 *       422:
 *         description: Mission not completed / invalid
 *       401:
 *         description: Unauthorized
 */
router.post('/:missionId/claim', idempotent('mission-claim'), async (req, res) => {
    try {
        const userId = req.user.id;
        const code = req.params.missionId;
        const { addStars } = require('../services/ledgerService.service');
        const result = await claimMission(userId, code, addStars);
        if (result.alreadyClaimed) return res.status(409).json({ status: 'error', message: 'Already claimed' });
        return res.json({ status: 'success', data: result });
    } catch (e) {
        console.error(e);
        return res.status(422).json({ status: 'error', message: e.message || 'Cannot claim' });
    }
});

module.exports = router;
