// src/routes/journal.routes.js
const express = require('express');
const router = express.Router();

const requireLogin = require('../middlewares/requireLogin.middleware');
const journalController = require('../controllers/journal.controller');

// Semua endpoint jurnal wajib login
router.use(requireLogin);

// Target bulanan
router.get('/monthly-target', journalController.getMonthlyTarget);
router.post('/monthly-target', journalController.setMonthlyTarget);

// Entri jurnal
router.get('/entries', journalController.listEntries);
router.get('/entries/by-date', journalController.getEntryByDate);
router.get('/entries/:id', journalController.getEntry);
router.post('/entries', journalController.createEntry);
router.put('/entries/:id', journalController.updateEntry);
router.delete('/entries/:id', journalController.deleteEntry);

// Kalender & Wawasan
router.get('/calendar', journalController.getCalendar);
router.get('/insights', journalController.getInsights);

module.exports = router;
