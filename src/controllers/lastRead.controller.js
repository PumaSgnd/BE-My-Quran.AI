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

        res.status(200).json({ status: 'success', data: rows });
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
            data: rows
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
        const query = `
      INSERT INTO last_read (user_id, ayah_id, updated_at)
      VALUES ($1, $2, NOW())
      RETURNING *;
    `;
        const { rows } = await db.query(query, [userId, ayah_id]);
        res.status(200).json({
            status: 'success',
            message: 'Data last read berhasil ditambahkan.',
            data: rows[0]
        });
    } catch (error) {
        console.error("Error di updateLastRead:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const deleteLastRead = async (req, res) => {
    const userId = req.user.id;
    const { ayah_id } = req.body;

    if (!ayah_id) {
        return res.status(400).json({
            status: 'error',
            message: 'ayah_id wajib diisi untuk menghapus data tertentu.',
        });
    }

    try {
        const result = await db.query(
            'DELETE FROM last_read WHERE user_id = $1 AND ayah_id = $2 RETURNING *;',
            [userId, ayah_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Data tidak ditemukan untuk dihapus.',
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Data terakhir dibaca berhasil dihapus.',
        });
    } catch (error) {
        console.error('Error di deleteLastRead:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

module.exports = { getLastRead, getLastReadForBaca, updateLastRead, deleteLastRead };
