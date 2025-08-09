// src/routes/surah.routes.js

const express = require('express');
const router = express.Router();
// Tambahkan getAyahsBySurahId ke dalam import
const { getAllSurahs, getSurahById, getAyahsBySurahId } = require('../controllers/surah.controller');

// Rute untuk mendapatkan semua surah
router.get('/', getAllSurahs);

// Rute untuk mendapatkan satu surah dengan ID
router.get('/:id', getSurahById);

// --- RUTE BARU DI SINI ---
// Rute untuk mendapatkan semua ayat dari sebuah surah
router.get('/:id/ayahs', getAyahsBySurahId);


module.exports = router;
