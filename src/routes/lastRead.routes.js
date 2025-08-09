// src/routes/lastRead.routes.js
const express = require('express');
const router = express.Router();
const { getLastRead, updateLastRead, deleteLastRead } = require('../controllers/lastRead.controller.js');
const { isLoggedIn } = require('../middlewares/auth.middleware.js');

// Terapkan middleware isLoggedIn ke semua rute di file ini
// Ini memastikan hanya user yang sudah login yang bisa mengakses fitur ini
router.use(isLoggedIn);

// Endpoint untuk mendapatkan data terakhir dibaca
router.get('/', getLastRead);

// Endpoint untuk memperbarui data terakhir dibaca
router.post('/', updateLastRead);

router.delete('/', deleteLastRead);

module.exports = router;
