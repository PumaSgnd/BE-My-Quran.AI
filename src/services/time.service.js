const { DateTime } = require('luxon');
const ZONE = process.env.APP_TZ || 'Asia/Jakarta';

function now() { return DateTime.now().setZone(ZONE); }
function todayStr() { return now().toISODate(); }
function dailyPeriodKey(dt = now()) { return dt.toISODate(); }
function weeklyPeriodKey(dt = now()) { return `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, '0')}`; }

module.exports = { now, todayStr, dailyPeriodKey, weeklyPeriodKey, ZONE };
