// src/services/journal.service.js
const { Op } = require('sequelize');
const { DateTime } = require('luxon');
const db = require('../models');
const { JournalMonthlyTarget, JournalEntry, sequelize } = db;
const { now, todayStr, weeklyPeriodKey, ZONE } = require('./time.service');

// =================== Helper waktu ===================
function parseYearMonth(rawYear, rawMonth) {
    let year = rawYear ? Number(rawYear) : null;
    let month = rawMonth ? Number(rawMonth) : null;

    const current = now();
    if (!year) year = current.year;
    if (!month) month = current.month;

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
        const err = new Error('Parameter tahun/bulan tidak valid');
        err.status = 400;
        throw err;
    }

    return { year, month };
}

function monthRangeFromDate(dt) {
    const start = dt.startOf('month');
    const end = dt.endOf('month');
    return {
        startDate: start.toISODate(),
        endDate: end.toISODate(),
    };
}

function monthRange(year, month) {
    const dt = DateTime.fromObject({ year, month, day: 1 }, { zone: ZONE });
    return monthRangeFromDate(dt);
}

function normalizeEntryDate(rawDate) {
    if (!rawDate) return todayStr();
    const dt = DateTime.fromISO(String(rawDate), { zone: ZONE });
    if (!dt.isValid) {
        const err = new Error('Tanggal entri tidak valid');
        err.status = 400;
        throw err;
    }
    return dt.toISODate();
}

function normalizeCheckinData(raw) {
    if (!raw) return {};
    if (typeof raw !== 'object' || Array.isArray(raw)) {
        const err = new Error('checkin_data harus berupa object');
        err.status = 400;
        throw err;
    }
    return raw;
}

// range = "week" | "month"
function computeRange(range, rawDate) {
    const base = rawDate
        ? DateTime.fromISO(String(rawDate), { zone: ZONE })
        : now();

    if (!base.isValid) {
        const err = new Error('Parameter tanggal tidak valid');
        err.status = 400;
        throw err;
    }

    if (range === 'month') {
        const { startDate, endDate } = monthRangeFromDate(base);
        return { type: 'month', startDate, endDate };
    }

    // default: week
    const start = base.startOf('week');
    const end = base.endOf('week');
    return {
        type: 'week',
        startDate: start.toISODate(),
        endDate: end.toISODate(),
    };
}

// =================== Target Bulanan ===================
async function getMonthlyTarget(userId, { year, month }) {
    const { year: y, month: m } = parseYearMonth(year, month);

    const row = await JournalMonthlyTarget.findOne({
        where: { user_id: userId, year: y, month: m },
    });

    if (!row) return null;

    return {
        year: row.year,
        month: row.month,
        target_text: row.target_text,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

async function setMonthlyTarget(userId, { year, month, targetText }) {
    const { year: y, month: m } = parseYearMonth(year, month);
    const text = String(targetText || '').trim();
    if (!text) {
        const err = new Error('target_text wajib diisi');
        err.status = 400;
        throw err;
    }

    const nowDate = new Date();

    const [row, created] = await JournalMonthlyTarget.findOrCreate({
        where: { user_id: userId, year: y, month: m },
        defaults: {
            user_id: userId,
            year: y,
            month: m,
            target_text: text,
            created_at: nowDate,
            updated_at: nowDate,
        },
    });

    if (!created) {
        row.target_text = text;
        row.updated_at = nowDate;
        await row.save();
    }

    return {
        year: row.year,
        month: row.month,
        target_text: row.target_text,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

// =================== Entri Harian ===================
async function createEntry(userId, payload) {
    const reflectionText = String(payload.reflection_text || '').trim();
    if (!reflectionText) {
        const err = new Error('reflection_text wajib diisi');
        err.status = 400;
        throw err;
    }

    const entry_date = normalizeEntryDate(payload.entry_date);
    const checkin_data = normalizeCheckinData(payload.checkin_data);
    const nowDate = new Date();

    // Upsert berdasarkan (user_id, entry_date):
    // jika sudah ada entri di tanggal tersebut, kita update; kalau belum, create.
    const [entry, created] = await JournalEntry.findOrCreate({
        where: { user_id: userId, entry_date },

        defaults: {
            user_id: userId,
            entry_date,
            reflection_text: reflectionText,
            checkin_data,
            created_at: nowDate,
            updated_at: nowDate,
        },
    });

    if (!created) {
        entry.reflection_text = reflectionText;
        entry.checkin_data = checkin_data;
        entry.updated_at = nowDate;
        await entry.save();
    }

    return entry;
}

async function getEntryById(userId, id) {
    const entry = await JournalEntry.findOne({
        where: { id, user_id: userId },
    });
    return entry;
}

async function getEntryByDate(userId, rawDate) {
    const date = normalizeEntryDate(rawDate);
    const entry = await JournalEntry.findOne({
        where: { user_id: userId, entry_date: date },
    });
    return entry;
}

async function updateEntry(userId, id, payload) {
    const entry = await getEntryById(userId, id);
    if (!entry) return null;

    if (payload.entry_date !== undefined) {
        entry.entry_date = normalizeEntryDate(payload.entry_date);
    }

    if (payload.reflection_text !== undefined) {
        const text = String(payload.reflection_text || '').trim();
        if (!text) {
            const err = new Error('reflection_text tidak boleh kosong');
            err.status = 400;
            throw err;
        }
        entry.reflection_text = text;
    }

    if (payload.checkin_data !== undefined) {
        entry.checkin_data = normalizeCheckinData(payload.checkin_data);
    }

    entry.updated_at = new Date();
    await entry.save();
    return entry;
}

async function deleteEntry(userId, id) {
    const count = await JournalEntry.destroy({
        where: { id, user_id: userId },
    });
    return count > 0;
}

async function listEntries(userId, filters) {
    const where = { user_id: userId };

    if (filters.date) {
        const date = normalizeEntryDate(filters.date);
        where.entry_date = date;
    } else if (filters.date_from || filters.date_to) {
        where.entry_date = {};
        if (filters.date_from) {
            where.entry_date[Op.gte] = normalizeEntryDate(filters.date_from);
        }
        if (filters.date_to) {
            where.entry_date[Op.lte] = normalizeEntryDate(filters.date_to);
        }
    } else if (filters.month || filters.year) {
        const { year, month } = parseYearMonth(filters.year, filters.month || null);
        const { startDate, endDate } = monthRange(year, month);
        where.entry_date = { [Op.between]: [startDate, endDate] };
    }

    const entries = await JournalEntry.findAll({
        where,
        order: [
            ['entry_date', 'DESC'],
            ['created_at', 'DESC'],
        ],
    });

    return entries;
}

// =================== Kalender ===================
async function getCalendarSummary(userId, { year, month }) {
    const { year: y, month: m } = parseYearMonth(year, month);
    const { startDate, endDate } = monthRange(y, m);

    const rows = await JournalEntry.findAll({
        attributes: [
            'entry_date',
            [sequelize.fn('COUNT', sequelize.col('id')), 'entry_count'],
        ],
        where: {
            user_id: userId,
            entry_date: { [Op.between]: [startDate, endDate] },
        },
        group: ['entry_date'],
        order: [['entry_date', 'ASC']],
    });

    const dates = rows.map((row) => ({
        date: row.entry_date,
        entry_count: Number(row.get('entry_count') || 0),
    }));

    return { year: y, month: m, dates };
}

// =================== Wawasan (Insights) ===================
async function getInsights(userId, { range, date }) {
    const { type, startDate, endDate } = computeRange(range || 'week', date);

    const entries = await JournalEntry.findAll({
        where: {
            user_id: userId,
            entry_date: { [Op.between]: [startDate, endDate] },
        },
        order: [
            ['entry_date', 'ASC'],
            ['created_at', 'ASC'],
        ],
    });

    const totalEntries = entries.length;

    function isEntryCreatedSameDay(e) {
        const createdDay = DateTime.fromJSDate(e.created_at, { zone: ZONE }).toISODate();
        return createdDay === e.entry_date;
    }
    // ---- daily counts + longest streak (berdasarkan entry_date di dalam range) ----
    const dailyMap = new Map();
    for (const e of entries) {
        if (!isEntryCreatedSameDay(e)) continue;
        const d = e.entry_date;
        if (!dailyMap.has(d)) {
            dailyMap.set(d, { date: d, count: 0 });
        }
        dailyMap.get(d).count += 1;
    }

    const daily = Array.from(dailyMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
    );

    let longestStreak = 0;
    let currentStreak = 0;
    let prevDate = null;
    for (const d of daily) {
        const dt = DateTime.fromISO(d.date, { zone: ZONE });
        if (!prevDate) {
            currentStreak = 1;
        } else {
            const diffDays = dt.diff(prevDate, 'days').days;
            if (diffDays === 1) {
                currentStreak += 1;
            } else {
                currentStreak = 1;
            }
        }
        if (currentStreak > longestStreak) longestStreak = currentStreak;
        prevDate = dt;
    }

    const daysWithEntries = daily.length;

    // ---- weekly buckets (untuk grafik kalau perlu) ----
    const weeklyMap = new Map();
    for (const e of entries) {
        const dt = DateTime.fromISO(e.entry_date, { zone: ZONE });
        const key = weeklyPeriodKey(dt);
        let bucket = weeklyMap.get(key);
        if (!bucket) {
            const weekStart = dt.startOf('week');
            bucket = {
                week_key: key,
                week_start: weekStart.toISODate(),
                entries: 0,
            };
            weeklyMap.set(key, bucket);
        }
        bucket.entries += 1;
    }

    const weekly = Array.from(weeklyMap.values()).sort((a, b) =>
        a.week_start.localeCompare(b.week_start),
    );

    // ---- Agregasi cek-in sesuai struktur checkin_data ----
    const prayers = {};   // { subuh: count, dzuhur: count, ... }
    const sunnah = {};    // gabungan sunnah_pagi/siang/malam/umum
    const charity = {};   // sedekah
    const feelings = {};  // mood dari refleksi
    let fastingDays = 0;

    const incMap = (map, key) => {
        if (!key) return;
        if (!map[key]) map[key] = 0;
        map[key] += 1;
    };

    for (const e of entries) {
        const data = e.checkin_data || {};
        if (typeof data !== 'object' || Array.isArray(data)) continue;

        // feelings (array di dalam checkin_data.feelings)
        if (Array.isArray(data.feelings)) {
            for (const f of data.feelings) {
                incMap(feelings, String(f));
            }
        }

        // highlight_photo_url tidak dihitung angka (hanya untuk tampilan)

        // prayers: object boolean
        if (data.prayers && typeof data.prayers === 'object') {
            for (const [slug, val] of Object.entries(data.prayers)) {
                if (val) incMap(prayers, String(slug));
            }
        }

        // fasting
        if (data.fasting && typeof data.fasting === 'object') {
            if (data.fasting.is_fasting) {
                fastingDays += 1;
            }
        }

        // sunnah sections (array slug)
        const sunnahKeys = ['sunnah_pagi', 'sunnah_siang', 'sunnah_malam', 'sunnah_umum'];
        for (const key of sunnahKeys) {
            const arr = data[key];
            if (Array.isArray(arr)) {
                for (const slug of arr) {
                    incMap(sunnah, String(slug));
                }
            }
        }

        // charity (sedekah)
        if (Array.isArray(data.charity)) {
            for (const slug of data.charity) {
                incMap(charity, String(slug));
            }
        }
    }

    return {
        range: type,          // "week" / "month"
        start_date: startDate,
        end_date: endDate,

        total_entries: totalEntries,
        days_with_entries: daysWithEntries,
        longest_streak_days: longestStreak,

        daily,
        weekly,

        fasting_days: fastingDays,
        prayers,
        sunnah,
        charity,
        feelings,
    };
}

module.exports = {
    getMonthlyTarget,
    setMonthlyTarget,
    createEntry,
    getEntryById,
    getEntryByDate,
    updateEntry,
    deleteEntry,
    listEntries,
    getCalendarSummary,
    getInsights,
};
