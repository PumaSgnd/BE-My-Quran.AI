// src/middlewares/dailyAyah.middleware.js
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ALLOWED_INCLUDES = new Set(['translation', 'audio', 'latin', 'tajwid']);

function parseInclude(str) {
    if (!str) return new Set();
    return new Set(
        String(str)
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(s => ALLOWED_INCLUDES.has(s))
    );
}

module.exports = function dailyAyahQueryValidator(req, res, next) {
    const q = req.query || {};

    // date
    let dateStr = typeof q.date === 'string' ? q.date.trim() : '';
    if (dateStr && !ISO_DATE_RE.test(dateStr)) {
        return res.status(400).json({ status: 'Error', message: 'Format date harus YYYY-MM-DD' });
    }
    const seedDate = dateStr ? new Date(`${dateStr}T00:00:00Z`) : new Date(); // pakai UTC biar deterministik

    // include flags
    const includeSet = parseInclude(q.include);

    // lang & reciter
    const lang = (q.lang || 'id').toString().trim().toLowerCase();
    let reciter = parseInt(q.reciter, 10);
    if (!Number.isInteger(reciter) || reciter <= 0) reciter = 1;

    req.dailyAyahOpts = {
        seedDate,
        include: includeSet,
        lang,
        reciter
    };

    return next();
};
