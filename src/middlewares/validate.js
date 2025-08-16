const { validationResult } = require('express-validator');

const validate = (rules) => [
    ...rules,
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ status: 'error', errors: errors.array() });
        }
        next();
    },
];

module.exports = { validate };
