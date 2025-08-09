// src/routes/bookmark.routes.js
const express = require('express');
const router = express.Router();
const { getMyBookmarks, addBookmark, deleteBookmark } = require('../controllers/bookmark.controller.js');
const { isLoggedIn } = require('../middlewares/auth.middleware.js');

// Terapkan middleware isLoggedIn ke semua rute di file ini
router.use(isLoggedIn);

router.get('/', getMyBookmarks);
router.post('/', addBookmark);
router.delete('/:bookmarkId', deleteBookmark);

module.exports = router;
