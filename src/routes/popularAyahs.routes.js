const express = require("express");
const router = express.Router();
const { getPopularAyahs } = require("../controllers/popularAyahs.controller");

router.get("/", getPopularAyahs);

module.exports = router;