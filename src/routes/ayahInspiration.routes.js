const express = require('express');
const { getAyahInspiration } = require('../controllers/ayahInspiration.controller');

const router = express.Router();

router.get('/', getAyahInspiration);

module.exports = router;
