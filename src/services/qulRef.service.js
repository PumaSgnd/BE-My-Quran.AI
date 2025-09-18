const { Surah } = require('../models');          // ⬅️

async function getAyahCount(surah) {
    const row = await Surah.findOne({ where: { id: surah }, attributes: ['verses_count'] });
    return row ? row.verses_count : 0;
}
async function validateAyahRange(surah, a1, a2) {
    if (!Number.isInteger(surah) || surah < 1 || surah > 114) return false;
    if (!Number.isInteger(a1) || !Number.isInteger(a2)) return false;
    const max = await getAyahCount(surah);
    if (max <= 0) return false;
    if (a1 < 1 || a2 < a1 || a2 > max) return false;
    return true;
}
async function countVersesInRange(surah, a1, a2) {
    return (await validateAyahRange(surah, a1, a2)) ? (a2 - a1 + 1) : 0;
}
module.exports = { getAyahCount, validateAyahRange, countVersesInRange };
