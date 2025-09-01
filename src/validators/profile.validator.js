// src/validators/profile.validator.js
const { body } = require('express-validator');

const updateProfileRules = [
    body('display_name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('display_name harus 1-100 karakter'),
    body('photo')
        .optional({ nullable: true })
        .trim()
        .isURL()
        .withMessage('photo harus berupa URL yang valid'),
];

module.exports = { updateProfileRules };
