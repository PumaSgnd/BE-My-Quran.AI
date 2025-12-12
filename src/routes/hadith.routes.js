const router = require('express').Router();
const ctrl = require('../controllers/hadith.controller');
const { isLoggedIn } = require('../middlewares/auth.middleware.js');

// Public
router.get('/categories', ctrl.getCategories);
router.get('/category/:book', ctrl.getByCategory);

// Attach user if token exists (to include read/note when viewing detail)
router.get('/:id', isLoggedIn, ctrl.getHadith);

// Protected endpoints
router.get('/note', isLoggedIn, ctrl.getNotes);
router.post('/note', isLoggedIn, ctrl.saveNote);
router.delete('/note', isLoggedIn, ctrl.deleteNote);

router.get('/read', isLoggedIn, ctrl.getReadList);
router.post('/read', isLoggedIn, ctrl.markRead);
router.delete('/read', isLoggedIn, ctrl.deleteRead);

module.exports = router;

