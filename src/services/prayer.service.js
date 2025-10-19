// src/services/prayer.service.js
const crypto = require('crypto');
const adhan = require('adhan');
const { DateTime } = require('luxon');
const { PrayerTimesCache} = require('../models/prayerTimesCache.model');
const { UserPrayerPref } = require('../models/userPrayerPref.model');

// Map metode perhitungan ke adhan
const METHOD_MAP = {
    MWL: 'MuslimWorldLeague',
    UmmAlQura: 'UmmAlQura',
    ISNA: 'NorthAmerica',
    Egypt: 'Egyptian',
    Moonsighting: 'MoonsightingCommittee',
    Dubai: 'Dubai',
    Qatar: 'Qatar',
    Kuwait: 'Kuwait',
    Singapore: 'Singapore',
    Turkey: 'Turkey',
    JAKIM: 'JAKIM', // jika tidak tersedia di versi adhan, fallback ke MWL di methodParams()
};

const MADHAB_MAP = { Shafi: adhan.Madhab.Shafi, Hanafi: adhan.Madhab.Hanafi };
const HLR_MAP = {
    MiddleOfTheNight: adhan.HighLatitudeRule.MiddleOfTheNight,
    SeventhOfTheNight: adhan.HighLatitudeRule.SeventhOfTheNight,
    TwilightAngle: adhan.HighLatitudeRule.TwilightAngle,
};

// Default server-side
const DEFAULTS = {
    method: 'MWL',
    madhab: 'Shafi',
    hlr: 'MiddleOfTheNight',
    offsets: { imsak: -10, fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
};

// Helper kecil
function round6(n) { return Math.round(n * 1e6) / 1e6; }

function ensureTz(tz) {
    try {
        if (Intl.supportedValuesOf && Intl.supportedValuesOf('timeZone').includes(tz)) return tz;
    } catch (_) { }
    const ok = DateTime.now().setZone(tz);
    if (!ok.isValid) throw new Error('Time zone tidak valid');
    return tz;
}

function methodParams(name) {
    const key = METHOD_MAP[name] || 'MuslimWorldLeague';
    const fn = adhan.CalculationMethod[key];
    if (!fn) {
        // fallback aman bila key tidak ada di versi adhan yang terpasang
        return adhan.CalculationMethod.MuslimWorldLeague();
    }
    return fn();
}

function addMinutes(date, minutes) { return new Date(date.getTime() + minutes * 60 * 1000); }

function formatHHmm(d, tz) {
    return DateTime.fromJSDate(d, { zone: 'utc' }).setZone(tz).toFormat('HH:mm');
}

function islamicDateStr(isoDate, tz) {
    const d = DateTime.fromISO(isoDate, { zone: tz }).toJSDate();
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    const monthMap = {
        'Muharram': 'Muharram', 'Safar': 'Safar', 'Rabiʻ I': 'Rabiulawal', 'Rabiʻ II': 'Rabiulakhir',
        'Jumada I': 'Jumadilawal', 'Jumada II': 'Jumadilakhir', 'Rajab': 'Rajab', 'Shaʻban': 'Syaban',
        'Ramadan': 'Ramadhan', 'Shawwal': 'Syawal', 'Dhuʻl-Qiʻdah': 'Dzulqa’dah', 'Dhuʻl-Hijjah': 'Dzulhijjah',
    };
    const parts = fmt.replace(/,\s*/g, ' ').split(' ');
    const day = parts[0], month = monthMap[parts.slice(1, -1).join(' ')] || parts[1], year = parts[parts.length - 1];
    return `${day} ${month} ${year}`;
}

function applyOffsets(times, offsets) {
    const fajr = times.fajr;
    return {
        imsak: addMinutes(fajr, offsets.imsak ?? -10),
        fajr: addMinutes(times.fajr, offsets.fajr ?? 0),
        sunrise: addMinutes(times.sunrise, offsets.sunrise ?? 0),
        dhuhr: addMinutes(times.dhuhr, offsets.dhuhr ?? 0),
        asr: addMinutes(times.asr, offsets.asr ?? 0),
        maghrib: addMinutes(times.maghrib, offsets.maghrib ?? 0),
        isha: addMinutes(times.isha, offsets.isha ?? 0),
    };
}

function currentAndNext(timesObj, tz, fromIso) {
    const order = ['imsak', 'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const now = fromIso ? DateTime.fromISO(fromIso, { zone: tz }) : DateTime.now().setZone(tz);
    const arr = order.map(name => ({ name, at: DateTime.fromJSDate(timesObj[name], { zone: 'utc' }).setZone(tz) }));

    let current = null, next = null;
    for (let i = 0; i < arr.length; i++) {
        const start = arr[i].at;
        const end = i < arr.length - 1 ? arr[i + 1].at : null;
        if (now >= start && (end === null || now < end)) {
            current = {
                name: capitalize(arr[i].name),
                started_at: start.toFormat('HH:mm'),
                ends_at: end ? end.toFormat('HH:mm') : null,
            };
            next = i < arr.length - 1
                ? { name: capitalize(arr[i + 1].name), at: arr[i + 1].at.toFormat('HH:mm'), in_seconds: Math.max(0, Math.round(arr[i + 1].at.diff(now).as('seconds'))) }
                : null;
            break;
        }
        if (now < start) {
            next = { name: capitalize(arr[i].name), at: start.toFormat('HH:mm'), in_seconds: Math.max(0, Math.round(start.diff(now).as('seconds'))) };
            break;
        }
    }
    if (!current && !next) next = { name: 'Imsak', at: null, in_seconds: null };
    return { current, next };
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function offsetsHash(offsets) { return crypto.createHash('sha256').update(JSON.stringify(offsets || {})).digest('hex').slice(0, 16); }

async function getUserPrefsOrDefault(userId) {
    if (!userId) return { ...DEFAULTS };
    try {
        const pref = await UserPrayerPref.findByPk(userId);
        if (!pref) return { ...DEFAULTS };
        return {
            method: pref.method || DEFAULTS.method,
            madhab: pref.madhab || DEFAULTS.madhab,
            hlr: pref.hlr || DEFAULTS.hlr,
            offsets: { ...DEFAULTS.offsets, ...(pref.offsets || {}) },
        };
    } catch {
        return { ...DEFAULTS };
    }
}

function buildParams(base) {
    const params = methodParams(base.method);
    params.madhab = MADHAB_MAP[base.madhab] || adhan.Madhab.Shafi;
    params.highLatitudeRule = HLR_MAP[base.hlr] || adhan.HighLatitudeRule.MiddleOfTheNight;
    return params;
}

async function computeDay({ lat, lng, tz, dateISO, method, madhab, hlr, offsets }) {
    ensureTz(tz);
    const d = DateTime.fromISO(dateISO, { zone: tz });
    if (!d.isValid) throw new Error('Tanggal tidak valid');

    const coords = new adhan.Coordinates(Number(lat), Number(lng));
    const params = buildParams({ method, madhab, hlr });

    // ✅ ADHAN JS: pakai Date biasa, bukan DateComponents
    // gunakan UTC-midnight supaya stabil lintas TZ
    const jsDate = new Date(Date.UTC(d.year, d.month - 1, d.day));

    const pt = new adhan.PrayerTimes(coords, jsDate, params);

    const baseTimes = {
        fajr: pt.fajr, sunrise: pt.sunrise, dhuhr: pt.dhuhr,
        asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha,
    };

    const adjusted = applyOffsets(baseTimes, offsets);

    const timesStr = {
        imsak: formatHHmm(adjusted.imsak, tz),
        fajr: formatHHmm(adjusted.fajr, tz),
        sunrise: formatHHmm(adjusted.sunrise, tz),
        dhuhr: formatHHmm(adjusted.dhuhr, tz),
        asr: formatHHmm(adjusted.asr, tz),
        maghrib: formatHHmm(adjusted.maghrib, tz),
        isha: formatHHmm(adjusted.isha, tz),
    };

    const { current, next } = currentAndNext(adjusted, tz);

    return {
        date: { gregorian: d.toISODate(), hijri: islamicDateStr(d.toISODate(), tz) },
        location: { lat: Number(lat), lng: Number(lng), tz },
        method, madhab, hlr,
        times: timesStr,
        current, next,
    };
}

async function getDayWithCache({ lat, lng, tz, dateISO, method, madhab, hlr, offsets }) {
    const rounded = { lat: round6(Number(lat)), lng: round6(Number(lng)) };
    const offHash = offsetsHash(offsets);
    const endOfDay = DateTime.fromISO(dateISO, { zone: tz }).endOf('day').toUTC().toJSDate();

    // cek cache (valid atau expired)
    const cached = await PrayerTimesCache.findOne({
        where: { date: dateISO, lat: rounded.lat, lng: rounded.lng, tz, method, madhab, hlr, offsets_hash: offHash },
    });

    if (cached && cached.expires_at > new Date()) return cached.result;

    // compute ulang
    const result = await computeDay({ lat: rounded.lat, lng: rounded.lng, tz, dateISO, method, madhab, hlr, offsets });

    // upsert dengan id jika ada supaya tidak duplicate
    const payload = {
        id: cached?.id,
        lat: rounded.lat,
        lng: rounded.lng,
        tz,
        date: dateISO,
        method,
        madhab,
        hlr,
        offsets,
        offsets_hash: offHash,
        result,
        expires_at: endOfDay,
        computed_at: new Date(),
    };

    await PrayerTimesCache.upsert(payload);

    return result;
}

async function getRange({ lat, lng, tz, startISO, endISO, method, madhab, hlr, offsets }) {
    const days = [];
    let cursor = DateTime.fromISO(startISO, { zone: tz });
    const end = DateTime.fromISO(endISO, { zone: tz });
    while (cursor <= end) {
        // eslint-disable-next-line no-await-in-loop
        const one = await getDayWithCache({ lat, lng, tz, dateISO: cursor.toISODate(), method, madhab, hlr, offsets });
        days.push(one);
        cursor = cursor.plus({ days: 1 });
    }
    return days;
}

module.exports = {
    DEFAULTS,
    getUserPrefsOrDefault,
    getDayWithCache,
    getRange,
};
