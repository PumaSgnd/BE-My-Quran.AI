// src/routes/tajwid.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tajwid.controller');

// GET /api/tajwid/surah/:surahId?page=&limit=
router.get('/surah/:surahId', ctrl.getSurahTajwid);

// GET /api/tajwid/surah/:surahId/ayah/:ayahNumber
router.get('/surah/:surahId/ayah/:ayahNumber', ctrl.getOneAyahTajwid);

module.exports = router;
