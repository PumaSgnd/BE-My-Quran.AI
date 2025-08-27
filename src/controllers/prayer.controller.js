const { DateTime } = require('luxon');
const { getUserPrefsOrDefault, getDayWithCache, getRange, DEFAULTS } = require('../services/prayer.service');

function parseOffsets(raw) {
    if (!raw) return null;
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
}

function getBaseParams(req, prefs) {
    const { lat, lng, tz, method, madhab, hlr } = req.query;
    return {
        lat: Number(lat),
        lng: Number(lng),
        tz,
        method: method || prefs.method || DEFAULTS.method,
        madhab: madhab || prefs.madhab || DEFAULTS.madhab,
        hlr: hlr || prefs.hlr || DEFAULTS.hlr,
        offsets: parseOffsets(req.query.offsets) || prefs.offsets || DEFAULTS.offsets,
    };
}

exports.getToday = async (req, res) => {
    try {
        const prefs = await getUserPrefsOrDefault(req.user?.id);
        const base = getBaseParams(req, prefs);
        const dateISO = req.query.date
            ? DateTime.fromISO(req.query.date, { zone: base.tz }).toISODate()
            : DateTime.now().setZone(base.tz).toISODate();
        const data = await getDayWithCache({ ...base, dateISO });
        res.json({ status: 'success', generated_at: new Date().toISOString(), data });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.getDate = async (req, res) => {
    try {
        const prefs = await getUserPrefsOrDefault(req.user?.id);
        const base = getBaseParams(req, prefs);
        const dateISO = DateTime.fromISO(req.params.date, { zone: base.tz }).toISODate();
        const data = await getDayWithCache({ ...base, dateISO });
        res.json({ status: 'success', generated_at: new Date().toISOString(), data });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.getWeek = async (req, res) => {
    try {
        const prefs = await getUserPrefsOrDefault(req.user?.id);
        const base = getBaseParams(req, prefs);
        const start = req.query.start
            ? DateTime.fromISO(req.query.start, { zone: base.tz })
            : DateTime.now().setZone(base.tz).startOf('week');
        const end = start.plus({ days: 6 });
        const data = await getRange({ ...base, startISO: start.toISODate(), endISO: end.toISODate() });
        res.json({ status: 'success', generated_at: new Date().toISOString(), data });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.getMonth = async (req, res) => {
    try {
        const prefs = await getUserPrefsOrDefault(req.user?.id);
        const base = getBaseParams(req, prefs);
        const monthStr = req.query.month;
        const first = monthStr
            ? DateTime.fromISO(`${monthStr}-01`, { zone: base.tz })
            : DateTime.now().setZone(base.tz).startOf('month');
        const last = first.endOf('month');
        const data = await getRange({ ...base, startISO: first.toISODate(), endISO: last.toISODate() });
        res.json({ status: 'success', generated_at: new Date().toISOString(), data });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.getNext = async (req, res) => {
    try {
        const prefs = await getUserPrefsOrDefault(req.user?.id);
        const base = getBaseParams(req, prefs);
        const from = req.query.from || DateTime.now().setZone(base.tz).toISO();
        const dateISO = DateTime.fromISO(from, { zone: base.tz }).toISODate();
        const day = await getDayWithCache({ ...base, dateISO });
        res.json({ status: 'success', generated_at: new Date().toISOString(), data: { next: day.next, date: day.date } });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.getPrefs = async (req, res) => {
    const data = await getUserPrefsOrDefault(req.user?.id);
    res.json({ status: 'success', data });
};

exports.setPrefs = async (req, res) => {
    try {
        if (!req.user?.id) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        const { UserPrayerPref } = require('../models');
        const body = req.body || {};
        const payload = {
            method: body.method || DEFAULTS.method,
            madhab: body.madhab || DEFAULTS.madhab,
            hlr: body.hlr || DEFAULTS.hlr,
            offsets: body.offsets || DEFAULTS.offsets,
            adhan: body.adhan || {},
            updated_at: new Date(),
        };
        await UserPrayerPref.upsert({ user_id: req.user.id, ...payload });
        res.json({ status: 'success', message: 'Preferensi disimpan', data: payload });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};
