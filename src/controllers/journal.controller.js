// src/controllers/journal.controller.js
const journalService = require('../services/journal.service');

function getUserId(req) {
    return req.user && req.user.id;
}

// ---------- Target Bulanan ----------
exports.getMonthlyTarget = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { year, month } = req.query;
        const data = await journalService.getMonthlyTarget(userId, { year, month });
        return res.json({ status: 'success', data });
    } catch (err) {
        console.error('getMonthlyTarget error:', err);
        const status = err.status || 500;
        return res.status(status).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
};

exports.setMonthlyTarget = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { year, month, target_text } = req.body || {};
        const data = await journalService.setMonthlyTarget(userId, { year, month, targetText: target_text });
        return res.json({ status: 'success', data });
    } catch (err) {
        console.error('setMonthlyTarget error:', err);
        const status = err.status || 500;
        return res.status(status).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
};

// ---------- Entri Harian ----------
exports.listEntries = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { date, month, year, date_from, date_to } = req.query;
        const entries = await journalService.listEntries(userId, { date, month, year, date_from, date_to });

        const data = entries.map((e) => ({
            id: e.id,
            entry_date: e.entry_date,
            reflection_text: e.reflection_text,
            checkin_data: e.checkin_data || {},
            created_at: e.created_at,
            updated_at: e.updated_at,
        }));

        return res.json({ status: 'success', data });
    } catch (err) {
        console.error('listEntries error:', err);
        const status = err.status || 500;
        return res.status(status).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
};

exports.getEntryByDate = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { date } = req.query;
        if (!date) return res.status(400).json({ status: 'error', message: 'Parameter date wajib diisi' });

        const entry = await journalService.getEntryByDate(userId, date);
        if (!entry) {
            return res.json({ status: 'success', data: null }); // belum ada entri di tanggal itu
        }

        return res.json({
            status: 'success',
            data: {
                id: entry.id,
                entry_date: entry.entry_date,
                reflection_text: entry.reflection_text,
                checkin_data: entry.checkin_data || {},
                created_at: entry.created_at,
                updated_at: entry.updated_at,
            },
        });
    } catch (err) {
        console.error('getEntryByDate error:', err);
        const status = err.status || 500;
        return res.status(status).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
};

exports.getEntry = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { id } = req.params;
        const entry = await journalService.getEntryById(userId, id);
        if (!entry) {
            return res.status(404).json({ status: 'error', message: 'Entri jurnal tidak ditemukan' });
        }

        return res.json({
            status: 'success',
            data: {
                id: entry.id,
                entry_date: entry.entry_date,
                reflection_text: entry.reflection_text,
                checkin_data: entry.checkin_data || {},
                created_at: entry.created_at,
                updated_at: entry.updated_at,
            },
        });
    } catch (err) {
        console.error('getEntry error:', err);
        const status = err.status || 500;
        return res.status(status).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
};

exports.createEntry = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const entry = await journalService.createEntry(userId, req.body || {});

        return res.status(201).json({
            status: 'success',
            data: {
                id: entry.id,
                entry_date: entry.entry_date,
                reflection_text: entry.reflection_text,
                checkin_data: entry.checkin_data || {},
                created_at: entry.created_at,
                updated_at: entry.updated_at,
            },
        });
    } catch (err) {
        console.error('createEntry error:', err);
        const status = err.status || 500;
        return res.status(status).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { id } = req.params;
        const entry = await journalService.updateEntry(userId, id, req.body || {});
        if (!entry) {
            return res.status(404).json({ status: 'error', message: 'Entri jurnal tidak ditemukan' });
        }

        return res.json({
            status: 'success',
            data: {
                id: entry.id,
                entry_date: entry.entry_date,
                reflection_text: entry.reflection_text,
                checkin_data: entry.checkin_data || {},
                created_at: entry.created_at,
                updated_at: entry.updated_at,
            },
        });
    } catch (err) {
        console.error('updateEntry error:', err);
        const status = err.status || 500;
        return res.status(status).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { id } = req.params;
        const ok = await journalService.deleteEntry(userId, id);
        if (!ok) {
            return res.status(404).json({ status: 'error', message: 'Entri jurnal tidak ditemukan' });
        }

        return res.json({ status: 'success', message: 'Entri jurnal berhasil dihapus' });
    } catch (err) {
        console.error('deleteEntry error:', err);
        const status = err.status || 500;
        return res.status(status).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
};

// ---------- Kalender & Wawasan ----------
exports.getCalendar = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { year, month } = req.query;
        const data = await journalService.getCalendarSummary(userId, { year, month });
        return res.json({ status: 'success', data });
    } catch (err) {
        console.error('getCalendar error:', err);
        const status = err.status || 500;
        return res.status(status).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
};

exports.getInsights = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const { range, date } = req.query;
        const data = await journalService.getInsights(userId, { range, date });
        return res.json({ status: 'success', data });
    } catch (err) {
        console.error('getInsights error:', err);
        const status = err.status || 500;
        return res.status(status).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
};
