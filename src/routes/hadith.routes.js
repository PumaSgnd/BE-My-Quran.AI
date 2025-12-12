const router = require('express').Router();
const ctrl = require('../controllers/hadith.controller');

// GET /api/hadith/bukhari      -> daftar hadits
// GET /api/hadith/bukhari/10   -> hadits nomor 10
router.get('/:book/:number?', ctrl.getHadith);

// POST /api/hadith/123/note
router.post('/:id/note', ctrl.saveNote);

// POST /api/hadith/123/read
router.post('/:id/read', ctrl.markRead);

module.exports = router;
