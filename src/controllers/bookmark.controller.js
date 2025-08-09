// src/controllers/bookmark.controller.js
const db = require('../config/db');

const getMyBookmarks = async (req, res) => {
    const userId = req.user.id; // Diambil dari session user yang login
    const query = `
            SELECT b.id as bookmark_id, a.*, s.name_simple as surah_name
            FROM bookmarks b
            JOIN ayahs a ON b.ayah_id = a.id
            JOIN surahs s ON a.surah_number = s.id
            WHERE b.user_id = $1
            ORDER BY b.created_at DESC;
        `;
    const { rows } = await db.query(query, [userId]);
    res.json({ status: 'success', data: rows });
};

const addBookmark = async (req, res) => {
    const userId = req.user.id;
    const { ayah_id } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO bookmarks (user_id, ayah_id) VALUES ($1, $2) RETURNING *',
            [userId, ayah_id]
        );
        res.status(201).json({ status: 'success', message: 'Ayat berhasil di-bookmark', data: rows[0] });
    } catch (error) {
        // Error code '23505' adalah untuk pelanggaran unique constraint
        if (error.code === '23505') {
            return res.status(409).json({ status: 'error', message: 'Ayat ini sudah di-bookmark sebelumnya.' });
        }
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const deleteBookmark = async (req, res) => {
    const userId = req.user.id;
    const { bookmarkId } = req.params;
    const { rowCount } = await db.query(
        'DELETE FROM bookmarks WHERE id = $1 AND user_id = $2',
        [bookmarkId, userId]
    );
    if (rowCount === 0) {
        return res.status(404).json({ status: 'error', message: 'Bookmark tidak ditemukan atau Anda tidak punya hak akses.' });
    }
    res.status(200).json({ status: 'success', message: 'Bookmark berhasil dihapus.' });
};

module.exports = { getMyBookmarks, addBookmark, deleteBookmark };
