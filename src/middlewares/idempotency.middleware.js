'use strict';
const db = require('../models');
const { IdempotencyKey } = db;

/**
 * Pakai: router.post(..., idempotent('checkin'), handler)
 * Wajib header: Idempotency-Key
 */
function idempotent(routeId) {
    return async function idempotencyMiddleware(req, res, next) {
        try {
            const key = req.get('Idempotency-Key');
            if (!key) return res.status(428).json({ status: 'error', message: 'Idempotency-Key required' });

            const userId = (req.user && (req.user.id ?? req.user.user_id)) ?? null;
            if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

            await IdempotencyKey.create({ user_id: userId, key, route: routeId });
            return next();
        } catch (err) {
            if (err && err.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ status: 'error', message: 'Duplicate request' });
            }
            console.error('Idempotency error:', err);
            return res.status(500).json({ status: 'error', message: 'Internal error' });
        }
    };
}

// 👉 Export DUO: default & named — agar kedua cara import bisa jalan
module.exports = idempotent;
module.exports.idempotent = idempotent;
