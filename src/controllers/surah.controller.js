// src/controllers/surah.controller.js

const db = require('../config/db');

// --- FUNGSI getAllSurahs dan getSurahById BIARKAN SEPERTI SEBELUMNYA ---
const getAllSurahs = async (req, res) => {
    try {
        const { search } = req.query; // Ambil parameter 'search' dari URL
        let query;
        let queryParams = [];

        if (search) {
            // Jika ada parameter search, gunakan query dengan filter ILIKE
            // ILIKE adalah LIKE yang case-insensitive (tidak peduli huruf besar/kecil)
            query = 'SELECT * FROM surahs WHERE name_simple ILIKE $1 ORDER BY id ASC';
            queryParams.push(`%${search}%`); // %...% berarti 'mengandung' kata kunci
        } else {
            // Jika tidak ada parameter search, tampilkan semua surah
            query = 'SELECT * FROM surahs ORDER BY id ASC';
        }

        const { rows } = await db.query(query, queryParams);

        res.status(200).json({
            status: 'success',
            count: rows.length,
            data: rows,
        });
    } catch (error) {
        console.error('Error di getAllSurahs:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const getSurahById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT s.*, si.short_text, si.long_text
            FROM surahs s
            LEFT JOIN surah_info si ON s.id = si.surah_id
            WHERE s.id = $1;
        `;
        const { rows } = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Surah tidak ditemukan' });
        }
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
        console.error('Error di getSurahById:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};


// --- GANTI FUNGSI LAMA DENGAN YANG BARU INI ---
const getAyahsBySurahId = async (req, res) => {
    try {
        const surahId = Number(req.params.id);

        // query lain (yg mungkin dipakai FE) — TIDAK bikin error walau belum kita gunakan
        const allFlag = req.query.all === '1';
        const page = allFlag ? 1 : (Number(req.query.page) || 1);
        const limitDefault = 50;
        const reqLimit = Number(req.query.limit) || limitDefault;
        const MAX_LIMIT = 300;
        const effLimit = allFlag ? undefined : Math.min(reqLimit, MAX_LIMIT);
        const offset = allFlag ? 0 : (page - 1) * Math.min(reqLimit, MAX_LIMIT);

        // cek surah
        const surahRes = await db.query(
            'SELECT id, name_simple FROM surahs WHERE id = $1',
            [surahId]
        );
        if (surahRes.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Surah tidak ditemukan' });
        }

        // hitung total
        const totalRes = await db.query(
            'SELECT COUNT(*)::int AS count FROM ayahs WHERE surah_number = $1',
            [surahId]
        );
        const total = totalRes.rows[0].count;
        const limitForQuery = allFlag ? Math.min(total, MAX_LIMIT) : effLimit;
        const totalPages = allFlag ? 1 : Math.max(1, Math.ceil(total / limitForQuery));

        // AMBIL * LALU MAP TEKS DI JS → aman kalau nama kolom beda
        const ayahsRes = await db.query(
            `SELECT *
         FROM ayahs
        WHERE surah_number = $1
        ORDER BY ayah_number ASC
        LIMIT $2 OFFSET $3`,
            [surahId, limitForQuery, offset]
        );

        // pilih kolom teks Arab yang tersedia
        const pickText = (r) =>
            r.text_uthmani ??
            r.text_qpc_hafs ??
            r.text_arabic ??
            r.text ??
            r.text_imlaei ??
            r.text_simple ?? // tambahkan kandidat lain kalau ada
            null;

        const data = ayahsRes.rows.map(r => ({
            id: r.id,
            ayah_number: r.ayah_number,
            verse_key: r.verse_key || `${surahId}:${r.ayah_number}`,
            text_ar: pickText(r), // <- inilah teks Arabnya
        }));

        return res.json({
            status: 'success',
            meta: {
                surah: { id: surahRes.rows[0].id, name: surahRes.rows[0].name_simple },
                page: allFlag ? 1 : page,
                limit: limitForQuery,
                total,
                totalPages
            },
            data
        });
    } catch (err) {
        console.error('getAyahsBySurahId error:', err);
        // Jangan bocorin detail di production
        return res.status(500).json({
            status: 'error',
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
        });
    }
};


// Pastikan module.exports tetap lengkap
module.exports = {
    getAllSurahs,
    getSurahById,
    getAyahsBySurahId,
};
