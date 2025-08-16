// src/controllers/bookmark.controller.js
const db = require('../config/db');

const getMyBookmarks = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const query = `
      SELECT 
        b.id AS bookmark_id,
        b.created_at,
        a.id AS ayah_id,
        a.surah_number,
        a.ayah_number,
        a.verse_key,
        a.text AS text_ar,
        s.name_simple AS surah_name
      FROM bookmarks b
      JOIN ayahs a   ON b.ayah_id = a.id
      JOIN surahs s  ON a.surah_number = s.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `;
        const { rows } = await db.query(query, [userId]);
        return res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error('getMyBookmarks error:', err);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const addBookmark = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const ayah_id = parseInt(req.body?.ayah_id, 10);
        if (!Number.isInteger(ayah_id) || ayah_id <= 0) {
            return res.status(400).json({ status: 'error', message: 'ayah_id harus integer > 0' });
        }

        // pastikan ayah exist
        const ay = await db.query('SELECT id FROM ayahs WHERE id = $1', [ayah_id]);
        if (ay.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Ayah tidak ditemukan' });
        }

        const { rows } = await db.query(
            `INSERT INTO bookmarks (user_id, ayah_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, ayah_id) DO NOTHING
       RETURNING id, user_id, ayah_id, created_at`,
            [userId, ayah_id]
        );

        if (rows.length === 0) {
            // sudah ada
            return res.status(409).json({ status: 'error', message: 'Ayat ini sudah di-bookmark sebelumnya.' });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Ayat berhasil di-bookmark',
            data: rows[0],
        });
    } catch (error) {
        console.error('addBookmark error:', error);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const deleteBookmark = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const bookmarkId = parseInt(req.params?.bookmarkId, 10);
        if (!Number.isInteger(bookmarkId) || bookmarkId <= 0) {
            return res.status(400).json({ status: 'error', message: 'bookmarkId tidak valid' });
        }

        const { rowCount } = await db.query(
            'DELETE FROM bookmarks WHERE id = $1 AND user_id = $2',
            [bookmarkId, userId]
        );
        if (rowCount === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Bookmark tidak ditemukan atau Anda tidak punya hak akses.',
            });
        }
        return res.status(200).json({ status: 'success', message: 'Bookmark berhasil dihapus.' });
    } catch (err) {
        console.error('deleteBookmark error:', err);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

module.exports = { getMyBookmarks, addBookmark, deleteBookmark };
