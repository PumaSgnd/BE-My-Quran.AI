const express = require("express");
const router = express.Router();
const { getPopular } = require("../controllers/popularAyahs.controller");

router.get("/", getPopular);

module.exports = router;