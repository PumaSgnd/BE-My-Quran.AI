    // src/routes/juz.routes.js
    const express = require('express');
    const router = express.Router();
    const { getAllJuz, getAyahsByJuzNumber } = require('../controllers/juz.controller.js');

    router.get('/', getAllJuz);
    router.get('/:juzNumber/ayahs', getAyahsByJuzNumber);

    module.exports = router;
    