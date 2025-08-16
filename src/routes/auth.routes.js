// src/routes/auth.routes.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

/**
 * @openapi
 * /auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Mulai login dengan Google (redirect ke Google)
 *     description: |
 *       Endpoint ini melakukan **redirect (302)** ke halaman OAuth Google.
 *       **Tidak bisa di-Try dari Swagger UI** karena membutuhkan redirect top-level (bukan XHR).
 *       Jalankan via browser/FE (contoh: `window.location.href = "/api/auth/google"`).
 *     operationId: authGoogle
 *     responses:
 *       302:
 *         $ref: '#/components/responses/RedirectToProvider'
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback Google OAuth
 *     description: Setelah sukses, session dibuat dan user di-redirect ke `/api/auth/profile`.
 *     operationId: authGoogleCallback
 *     responses:
 *       302:
 *         $ref: '#/components/responses/RedirectToProfile'
 *       500:
 *         description: Gagal tukar code OAuth menjadi token / gagal simpan user
 */
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/api/auth/profile' }),
    (req, res) => res.redirect('/api/auth/profile')
);

/**
 * @openapi
 * /auth/facebook:
 *   get:
 *     tags: [Auth]
 *     summary: Mulai login dengan Facebook (redirect ke Facebook)
 *     description: |
 *       Endpoint ini melakukan **redirect (302)** ke halaman OAuth Facebook.
 *       **Tidak bisa di-Try dari Swagger UI** karena membutuhkan redirect top-level (bukan XHR).
 *       Jalankan via browser/FE (contoh: `window.location.href = "/api/auth/facebook"`).
 *     operationId: authFacebook
 *     responses:
 *       302:
 *         $ref: '#/components/responses/RedirectToProvider'
 */
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

/**
 * @openapi
 * /auth/facebook/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Callback Facebook OAuth
 *     description: Setelah sukses, session dibuat dan user di-redirect ke `/api/auth/profile`.
 *     operationId: authFacebookCallback
 *     responses:
 *       302:
 *         $ref: '#/components/responses/RedirectToProfile'
 *       500:
 *         description: Gagal tukar code OAuth menjadi token / gagal simpan user
 */
router.get(
    '/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/api/auth/profile' }),
    (req, res) => res.redirect('/api/auth/profile')
);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Cek user yang sedang login (pakai session cookie)
 *     operationId: getProfile
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profil user aktif
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "success" }
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   user:
 *                     id: 1
 *                     provider: google
 *                     provider_id: "108032807703254427138"
 *                     display_name: Surya
 *                     email: suryanurjaman91@gmail.com
 *                     created_at: "2025-08-12T12:34:56.000Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/profile', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.json({ status: 'success', user: req.user });
    }
    res.status(401).json({ status: 'error', message: 'Tidak ada user yang login' });
});

/**
 * @openapi
 * /auth/logout:
 *   get:
 *     tags: [Auth]
 *     summary: Logout (hapus session)
 *     operationId: logout
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout sukses
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   message: Berhasil logout
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.json({ status: 'success', message: 'Berhasil logout' });
    });
});

module.exports = router;
