// src/controllers/juz.controller.js
const db = require('../config/db');

const getAllJuz = async (req, res) => {
    try {
        const { search } = req.query;
        let query;
        let queryParams = [];

        if (search && !isNaN(parseInt(search))) {
            // Jika ada parameter search dan merupakan angka, cari juz spesifik
            query = 'SELECT * FROM juz WHERE juz_number = $1 ORDER BY juz_number ASC';
            queryParams.push(parseInt(search));
        } else {
            // Jika tidak, tampilkan semua juz
            query = 'SELECT * FROM juz ORDER BY juz_number ASC';
        }

        const { rows } = await db.query(query, queryParams);
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Error di getAllJuz:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const getAyahsByJuzNumber = async (req, res) => {
    try {
        const { juzNumber } = req.params;
        const { lang } = req.query;

        let query;
        const queryParams = [juzNumber];

        if (lang) {
            query = `
                    SELECT a.*, t.translation_text, t.footnotes
                    FROM ayahs a
                    LEFT JOIN translations t ON a.id = t.ayah_id AND t.author_name = $2
                    WHERE a.juz_number = $1
                    ORDER BY a.id ASC;
                `;
            queryParams.push(lang.charAt(0).toUpperCase() + lang.slice(1));
        } else {
            query = 'SELECT * FROM ayahs WHERE juz_number = $1 ORDER BY id ASC';
        }

        const { rows } = await db.query(query, queryParams);
        res.status(200).json({ status: 'success', juz_number: parseInt(juzNumber), count: rows.length, data: rows });

    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

module.exports = { getAllJuz, getAyahsByJuzNumber };
