const express = require('express');
const { getDzikir } = require('../controllers/dzikir.controller');

const router = express.Router();

router.get('/', getDzikir);

module.exports = router;