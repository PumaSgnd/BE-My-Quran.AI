// src/controllers/lastRead.controller.js
const db = require('../config/db');

const getLastRead = async (req, res) => {
    const userId = req.user.id;
    try {
        const query = `
                SELECT 
                    lr.updated_at,
                    a.id as ayah_id,
                    a.ayah_number,
                    a.verse_key,
                    s.id as surah_id,
                    s.name_simple as surah_name,
                    s.name_translation_id as surah_translation
                FROM 
                    last_read lr
                JOIN 
                    ayahs a ON lr.ayah_id = a.id
                JOIN 
                    surahs s ON a.surah_number = s.id
                WHERE 
                    lr.user_id = $1;
            `;
        const { rows } = await db.query(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ status: 'success', message: 'Belum ada data terakhir dibaca.', data: null });
        }

        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
        console.error("Error di getLastRead:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const getLastReadForBaca = async (req, res) => {
    const userId = req.user.id;
    try {
        const query = `
            SELECT 
                lr.updated_at,
                a.id AS ayah_id,
                a.ayah_number,
                a.verse_key,
                a.text AS text_ar,
                s.id AS surah_id,
                s.name AS surah_name,
                s.name_arabic AS surah_name_ar,
                s.name_simple AS surah_code,
                s.name_translation_id AS surah_translation
            FROM 
                last_read lr
            JOIN 
                ayahs a ON lr.ayah_id = a.id
            JOIN 
                surahs s ON a.surah_number = s.id
            WHERE 
                lr.user_id = $1;
        `;


        const { rows } = await db.query(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'success',
                message: 'Belum ada data terakhir dibaca.',
                data: null
            });
        }

        // Kalau kamu mau data lengkap untuk halaman baca
        res.status(200).json({
            status: 'success',
            message: 'Data terakhir dibaca berhasil diambil.',
            data: rows[0]
        });
    } catch (error) {
        console.error("Error di getLastReadForBaca:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};

const updateLastRead = async (req, res) => {
    const userId = req.user.id;
    const { ayah_id } = req.body;

    if (!ayah_id) {
        return res.status(400).json({ status: 'error', message: 'ayah_id wajib diisi.' });
    }

    try {
        // Ini adalah query "UPSERT": UPDATE or INSERT. Sangat efisien!
        // Jika user_id sudah ada, dia akan UPDATE. Jika belum ada, dia akan INSERT.
        const query = `
                INSERT INTO last_read (user_id, ayah_id)
                VALUES ($1, $2)
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    ayah_id = EXCLUDED.ayah_id,
                    updated_at = NOW()
                RETURNING *;
            `;
        const { rows } = await db.query(query, [userId, ayah_id]);
        res.status(200).json({ status: 'success', message: 'Data terakhir dibaca berhasil diperbarui.', data: rows[0] });
    } catch (error) {
        console.error("Error di updateLastRead:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const deleteLastRead = async (req, res) => {
    const userId = req.user.id;
    try {
        // Hapus baris dari tabel last_read yang cocok dengan user_id
        await db.query('DELETE FROM last_read WHERE user_id = $1', [userId]);

        // Kirim response sukses, tidak masalah apakah ada baris yang dihapus atau tidak
        res.status(200).json({ status: 'success', message: 'Data terakhir dibaca berhasil dihapus (jika ada).' });
    } catch (error) {
        console.error("Error di deleteLastRead:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

module.exports = { getLastRead, getLastReadForBaca, updateLastRead, deleteLastRead };
