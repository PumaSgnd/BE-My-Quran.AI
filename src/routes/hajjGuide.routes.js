const express = require('express');
const router = express.Router();

const {
    getHajjGuides,
    getHajjGuideSteps
} = require('../controllers/hajjGuide.controller');


// daftar guide
router.get('/', getHajjGuides);

// steps guide
router.get('/:guideId/steps', getHajjGuideSteps);

module.exports = router;
