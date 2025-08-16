// src/controllers/tajwid.controller.js
const db = require('../config/db');

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

exports.getSurahTajwid = async (req, res) => {
    try {
        const surahId = Number(req.params.surahId);
        if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
            return res.status(400).json({ status: 'error', message: 'Param :surahId tidak valid' });
        }

        const page = clamp(parseInt(req.query.page || '1', 10) || 1, 1, 999999);
        const limit = clamp(parseInt(req.query.limit || '20', 10) || 20, 1, 100);
        const offset = (page - 1) * limit;

        // Header surah (optional tapi membantu FE)
        const sh = await db.query(
            `SELECT id, name_simple, name_arabic, verses_count
         FROM surahs WHERE id = $1`,
            [surahId]
        );
        if (sh.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Surah tidak ditemukan' });
        }
        const surah = sh.rows[0];

        const totalRes = await db.query(
            `SELECT COUNT(*)::int AS total FROM tajwid_verses WHERE surah_number = $1`,
            [surahId]
        );
        const total = totalRes.rows[0].total;

        const rows = await db.query(
            `SELECT id, ayah_id, verse_key, surah_number, ayah_number, markup
         FROM tajwid_verses
        WHERE surah_number = $1
        ORDER BY ayah_number ASC
        LIMIT $2 OFFSET $3`,
            [surahId, limit, offset]
        );

        return res.status(200).json({
            status: 'success',
            surah: {
                id: surah.id,
                name_simple: surah.name_simple,
                name_arabic: surah.name_arabic,
                verses_count: surah.verses_count
            },
            meta: {
                page, limit, total,
                totalPages: Math.max(1, Math.ceil(total / limit))
            },
            data: rows.rows.map(r => ({
                id: r.id,
                ayah_id: r.ayah_id,
                ayah_number: r.ayah_number,
                verse_key: r.verse_key,
                markup: r.markup
            }))
        });
    } catch (err) {
        console.error('getSurahTajwid error:', err);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

exports.getOneAyahTajwid = async (req, res) => {
    try {
        const surahId = Number(req.params.surahId);
        const ayahNo = Number(req.params.ayahNumber);

        if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
            return res.status(400).json({ status: 'error', message: 'Param :surahId tidak valid' });
        }
        if (!Number.isInteger(ayahNo) || ayahNo < 1) {
            return res.status(400).json({ status: 'error', message: 'Param :ayahNumber tidak valid' });
        }

        const q = await db.query(
            `SELECT id, ayah_id, verse_key, surah_number, ayah_number, markup
         FROM tajwid_verses
        WHERE surah_number = $1 AND ayah_number = $2
        LIMIT 1`,
            [surahId, ayahNo]
        );
        if (q.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Tajwid tidak ditemukan untuk ayat tsb' });
        }
        return res.status(200).json({ status: 'success', data: q.rows[0] });
    } catch (err) {
        console.error('getOneAyahTajwid error:', err);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};
