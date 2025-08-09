// src/routes/reciter.routes.js
const express = require('express');
const router = express.Router();
const { getAllReciters, getAudioFileForSurah } = require('../controllers/reciter.controller.js');

// URL: GET /api/v1/reciters
// Endpoint ini akan mengambil daftar semua Qari yang ada di database.
router.get('/', getAllReciters);

// URL: GET /api/v1/reciters/1/surahs/114
// Endpoint ini akan mengambil link audio untuk surah tertentu (:surahId)
// yang dibacakan oleh Qari tertentu (:reciterId).
router.get('/:reciterId/surahs/:surahId', getAudioFileForSurah);

module.exports = router;
