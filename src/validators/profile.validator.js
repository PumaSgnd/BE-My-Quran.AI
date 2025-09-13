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
            if (req.file) return true; // kalau upload file
            if (!value) return true;   // boleh kosong

            // Kalau base64 data URI
            if (value.startsWith("data:image/")) return true;

            // Kalau URL biasa
            try {
                new URL(value);
                return true;
            } catch {
                throw new Error("photo harus berupa URL, Base64, atau file PNG/JPG");
            }
        }),
];

module.exports = { updateProfileRules };
