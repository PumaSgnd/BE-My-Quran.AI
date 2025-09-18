const express = require('express');
const router = express.Router();
const requireLogin = require('../middlewares/requireLogin.middleware');
const { getWallet } = require('../services/ledgerService.service');

router.use(requireLogin);

/**
 * @swagger
 * tags:
 *   - name: Wallet
 *     description: Saldo bintang pengguna.
 */

/**
 * @swagger
 * /wallet:
 *   get:
 *     tags: [Wallet]
 *     security:
 *       - cookieAuth: []
 *     summary: Ambil saldo bintang
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data: { stars: 140 }
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req, res) => {
    try {
        const w = await getWallet(req.user.id);
        return res.json({ status: 'success', data: { stars: w.stars } });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ status: 'error', message: 'Internal error' });
    }
});

module.exports = router;
