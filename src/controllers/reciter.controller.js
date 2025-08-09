// src/controllers/reciter.controller.js
const db = require('../config/db');

// Fungsi untuk mendapatkan daftar semua Qari
const getAllReciters = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, name, style, slug FROM reciters ORDER BY name ASC');
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Error di getAllReciters:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

// Fungsi untuk mendapatkan file audio surah penuh
const getAudioFileForSurah = async (req, res) => {
    try {
        const { reciterId, surahId } = req.params;
        const { rows } = await db.query(
            'SELECT audio_url FROM audio_files WHERE reciter_id = $1 AND surah_id = $2',
            [reciterId, surahId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'File audio tidak ditemukan untuk Qari dan Surah ini.' });
        }
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
        console.error('Error di getAudioFileForSurah:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

module.exports = { getAllReciters, getAudioFileForSurah };
