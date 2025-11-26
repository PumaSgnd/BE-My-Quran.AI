const express = require('express');
const router = express.Router();
const {
  getMyNotes,
  upsertNote,
  deleteNote
} = require('../controllers/note.controller');

const { isLoggedIn } = require('../middlewares/auth.middleware');

// semua butuh login
router.use(isLoggedIn);

// GET semua catatan user
router.get('/', getMyNotes);

// POST tambah / update catatan
router.post('/', upsertNote);

// DELETE catatan berdasarkan ayahId
router.delete('/:ayahId', deleteNote);

module.exports = router;
