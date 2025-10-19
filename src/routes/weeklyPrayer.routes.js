const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/auth.middleware.js");
const {
  getWeeklyPrayers,
  toggleWeeklyPrayer,
} = require("../controllers/weeklyPrayerController.js");

// ✅ Hanya user login yang bisa akses
router.get("/:userId", isLoggedIn, getWeeklyPrayers);
router.post("/", isLoggedIn, toggleWeeklyPrayer);

module.exports = router;