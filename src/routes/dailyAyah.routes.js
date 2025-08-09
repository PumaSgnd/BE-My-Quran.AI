// src/routes/dailyAyah.routes.js
const express = require('express');
const router = express.Router();
const { getDailyAyah } = require('../controllers/dailyAyah.controller.js');

// URL: GET /api/v1/daily-ayah
router.get('/', getDailyAyah);

module.exports = router;
