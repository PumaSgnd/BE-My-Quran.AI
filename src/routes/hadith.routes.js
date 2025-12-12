const router = require('express').Router();
const ctrl = require('../controllers/hadith.controller');
const { isLoggedIn } = require('../middlewares/auth.middleware.js');

// Public
router.get('/categories', ctrl.getCategories);
router.get('/category/:book', ctrl.getByCategory);

// Protected lists
router.get('/note', isLoggedIn, ctrl.getNotes);
router.get('/read', isLoggedIn, ctrl.getReadList);

// Protected write
router.post('/note', isLoggedIn, ctrl.saveNote);
router.delete('/note', isLoggedIn, ctrl.deleteNote);

router.post('/read', isLoggedIn, ctrl.markRead);
router.delete('/read', isLoggedIn, ctrl.deleteRead);

// Detail hadith — PUT PALING BAWAH
router.get('/:id', isLoggedIn, ctrl.getHadith);

module.exports = router;
