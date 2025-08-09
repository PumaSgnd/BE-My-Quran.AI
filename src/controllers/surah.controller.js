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
        const { id } = req.params; // nomor surah
        const { lang, reciter, segments } = req.query; // parameter query

        // 1. Bangun query dasar untuk mengambil data ayat
        let selectClauses = ['a.*'];
        let joinClauses = '';
        const queryParams = [id];

        // 2. Jika ada parameter ?lang, tambahkan data terjemahan
        if (lang) {
            selectClauses.push('t.translation_text', 't.footnotes');
            joinClauses += ` LEFT JOIN translations t ON a.id = t.ayah_id AND t.author_name = $${queryParams.length + 1}`;
            const authorName = lang.charAt(0).toUpperCase() + lang.slice(1);
            queryParams.push(authorName);
        }

        // 3. Jika ada parameter ?segments=true dan ?reciter, tambahkan data segmen
        if (segments === 'true' && reciter) {
            // Ini adalah subquery canggih untuk mengambil semua segmen
            // yang cocok dan menggabungkannya menjadi satu kolom JSON bernama "segments"
            const subQuery = `
                (SELECT json_agg(
                    json_build_object(
                        'pos', seg.word_position,
                        'start', seg.start_time_ms,
                        'end', seg.end_time_ms
                    ) ORDER BY seg.word_position ASC
                )
                FROM audio_segments seg
                WHERE seg.ayah_id = a.id AND seg.reciter_id = $${queryParams.length + 1})
            `;
            selectClauses.push(`${subQuery} as segments`);
            queryParams.push(reciter);
        }

        // 4. Gabungkan semua bagian menjadi satu query SQL akhir
        const query = `
            SELECT ${selectClauses.join(', ')}
            FROM ayahs a
            ${joinClauses}
            WHERE a.surah_number = $1
            ORDER BY a.ayah_number ASC;
        `;

        // 5. Eksekusi query
        const { rows } = await db.query(query, queryParams);

        if (rows.length === 0) {
            const surahCheck = await db.query('SELECT id FROM surahs WHERE id = $1', [id]);
            if (surahCheck.rows.length === 0) {
                return res.status(404).json({ status: 'error', message: `Surah dengan ID ${id} tidak ditemukan.` });
            }
        }

        res.status(200).json({
            status: 'success',
            surah_number: parseInt(id, 10),
            count: rows.length,
            data: rows,
        });

    } catch (error) {
        console.error('Error di getAyahsBySurahId:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};


// Pastikan module.exports tetap lengkap
module.exports = {
    getAllSurahs,
    getSurahById,
    getAyahsBySurahId,
};
