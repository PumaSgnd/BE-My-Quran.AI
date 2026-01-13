const express = require('express');
const router = express.Router();
const controller = require('../controllers/ayahMemorization.controller');
const { isLoggedIn } = require('../middlewares/auth.middleware.js');

router.use(isLoggedIn);

router.get(
    '/surah/:surahId',
    controller.getAyahMemorizationBySurah
);

router.get(
    '/counts',
    controller.getMemorizationCounts
);

router.post(
    '/',
    controller.setAyahMemorizationStatus
);

router.delete(
    '/',
    controller.deleteAyahMemorization
);

module.exports = router;
