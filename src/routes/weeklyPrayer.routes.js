const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/auth.middleware.js');
const prayerWeeklyController = require('../controllers/prayerWeekly.controller.js');

router.get('/', isLoggedIn, prayerWeeklyController.getWeekly);
router.post('/', isLoggedIn, prayerWeeklyController.toggleShalat);
router.delete('/', isLoggedIn, prayerWeeklyController.deleteShalat);

module.exports = router;
