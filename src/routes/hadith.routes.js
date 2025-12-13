const router = require('express').Router();
const ctrl = require('../controllers/hadith.controller');
const { isLoggedIn } = require('../middlewares/auth.middleware.js');

// ---------- PUBLIC ----------
// Get list of books/categories
router.get('/categories', ctrl.getCategories);

// Get all hadiths by book
router.get('/category/:book', ctrl.getByCategory);

router.get(
    '/category/:book/section/:id',
    ctrl.getBySection
);

// ---------- PROTECTED (require login) ----------
router.use(isLoggedIn);

// Notes
router.get('/note', ctrl.getNotes);
router.post('/note', ctrl.saveNote);
router.delete('/note', ctrl.deleteNote);

// Read status
router.get('/read', ctrl.getReadList);
router.post('/read', ctrl.markRead);
router.delete('/read', ctrl.deleteRead);

// ---------- DETAIL HADITH ----------
// Letakkan paling bawah supaya tidak tertangkap route /category/:book
router.get('/:id', ctrl.getHadith);

module.exports = router;
