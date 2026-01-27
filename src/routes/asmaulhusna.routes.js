const express = require('express');
const {
    getAsmaulHusna,
    getAsmaulHusnaById,
    getRandomAsmaulHusna,
} = require('../controllers/asmaulhusna.controller');

const router = express.Router();

// List + Search
router.get('/', getAsmaulHusna);

// Random
router.get('/random', getRandomAsmaulHusna);

// Detail by ID
router.get('/:id', getAsmaulHusnaById);

module.exports = router;
