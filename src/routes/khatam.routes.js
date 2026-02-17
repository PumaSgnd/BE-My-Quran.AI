const express = require('express');
const router = express.Router();
const khatam = require('../controllers/khatam.controller');
const { isLoggedIn } = require('../middlewares/auth.middleware');

router.use(isLoggedIn);

router.post('/create', khatam.createPlan);
router.get('/active', khatam.getActivePlan);
router.get('/history', khatam.getHistory);
router.put('/:id', khatam.updatePlan);
router.delete('/:id', khatam.deletePlan);
router.get('/achievements', khatam.getAllAchievements);
router.get('/achievements/me', khatam.getMyAchievements);
router.post('/achievements/claim', khatam.claimAchievement);

module.exports = router;