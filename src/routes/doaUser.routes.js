const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/auth.middleware');
const controller = require('../controllers/prayerStatus.controller');

// ============================
// 📖 READ STATUS
// ============================
router.get('/read', isLoggedIn, controller.getRead);
router.post('/read', isLoggedIn, controller.addRead);
router.delete('/read', isLoggedIn, controller.deleteRead);

// ============================
// ❤️ FAVORITE STATUS
// ============================
router.get('/favorite', isLoggedIn, controller.getFavorite);
router.post('/favorite', isLoggedIn, controller.addFavorite);
router.delete('/favorite', isLoggedIn, controller.deleteFavorite);

// ============================
// 📝 NOTE
// ============================
router.get('/note', isLoggedIn, controller.getNote);
router.post('/note', isLoggedIn, controller.addOrUpdateNote);
router.delete('/note', isLoggedIn, controller.deleteNote);

module.exports = router;
