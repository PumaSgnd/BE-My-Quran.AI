const express = require('express');
const router = express.Router();
const { 
  getLastRead, 
  getLastReadForBaca, 
  updateLastRead, 
  deleteLastRead 
} = require('../controllers/lastRead.controller');
const { isLoggedIn } = require('../middlewares/auth.middleware');

router.use(isLoggedIn);

router.get('/', getLastRead);

router.get('/baca', getLastReadForBaca);

router.post('/', updateLastRead);

router.delete('/:surah_id/:ayah_id', deleteLastRead);

module.exports = router;
