const db = require('../config/db');

const getAsmaulHusna = async (req, res) => {
    try {
        const { q } = req.query; // untuk search

        let query = `
            SELECT
                id,
                arabic,
                latin,
                meaning
            FROM asmaul_husna
        `;

        const values = [];

        // Search by latin / meaning
        if (q) {
            query += ` WHERE latin ILIKE $1 OR meaning ILIKE $1`;
            values.push(`%${q}%`);
        }

        query += ' ORDER BY id ASC';

        const { rows } = await db.query(query, values);

        return res.json({
            status: 'success',
            total: rows.length,
            data: rows,
        });
    } catch (err) {
        console.error('getAsmaulHusna error:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

const getAsmaulHusnaById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT
                id,
                arabic,
                latin,
                meaning
            FROM asmaul_husna
            WHERE id = $1
        `;

        const { rows } = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Asmaul Husna not found',
            });
        }

        return res.json({
            status: 'success',
            data: rows[0],
        });
    } catch (err) {
        console.error('getAsmaulHusnaById error:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

const getRandomAsmaulHusna = async (req, res) => {
    try {
        const query = `
            SELECT
                id,
                arabic,
                latin,
                meaning
            FROM asmaul_husna
            ORDER BY RANDOM()
            LIMIT 1
        `;

        const { rows } = await db.query(query);

        return res.json({
            status: 'success',
            data: rows[0],
        });
    } catch (err) {
        console.error('getRandomAsmaulHusna error:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

module.exports = {
    getAsmaulHusna,
    getAsmaulHusnaById,
    getRandomAsmaulHusna,
};
