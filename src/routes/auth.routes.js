// src/routes/auth.routes.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Rute untuk memulai login dengan Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Rute callback setelah login Google berhasil
router.get('/google/callback', passport.authenticate('google'), (req, res) => {
    // Redirect ke frontend setelah berhasil login
    res.redirect('/api/v1/auth/profile'); // Ganti dengan URL frontend-mu nanti
});

// Rute untuk memulai login dengan Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Rute callback setelah login Facebook berhasil
router.get('/facebook/callback', passport.authenticate('facebook'), (req, res) => {
    res.redirect('/api/v1/auth/profile'); // Ganti dengan URL frontend-mu nanti
});

// Rute untuk logout
router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.json({ status: 'success', message: 'Berhasil logout' });
    });
});

// Rute untuk mengecek profil user yang sedang login
router.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ status: 'success', user: req.user });
    } else {
        res.status(401).json({ status: 'error', message: 'Tidak ada user yang login' });
    }
});

module.exports = router;
