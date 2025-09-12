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
        .custom((value, { req }) => {
            if (req.file) return true; // kalau upload file, skip URL check
            if (!value) return true; // kosong boleh
            try {
                new URL(value); // kalau pakai URL, harus valid
                return true;
            } catch {
                throw new Error('photo harus berupa URL atau file PNG/JPG');
            }
        }),
];

module.exports = { updateProfileRules };
