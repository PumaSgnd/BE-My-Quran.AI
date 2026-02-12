const express = require('express');
const router = express.Router();
const khatam = require('../controllers/khatam.controller');

router.post('/create', khatam.createPlan);
router.get('/active', khatam.getActivePlan);
router.delete('/:id', khatam.deletePlan);

module.exports = router;