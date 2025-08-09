// src/routes/content.routes.js
const express = require('express');
const router = express.Router();
// Ganti nama fungsi yang di-import
const { getTemukanPageContent } = require('../controllers/content.controller.js');

// Ganti nama endpoint agar lebih deskriptif
// URL: GET /api/v1/content/temukan
router.get('/temukan', getTemukanPageContent);

module.exports = router;
