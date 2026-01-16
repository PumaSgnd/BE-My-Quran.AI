const db = require('../config/db');

const getDzikir = async (req, res) => {
    try {
        const { type } = req.query;

        let query = `
            SELECT
                id,
                type,
                arab,
                latin,
                indo,
                ulang
            FROM dzikir
        `;
        const values = [];

        if (type) {
            query += ' WHERE type = $1';
            values.push(type);
        }

        query += ' ORDER BY id ASC';

        const { rows } = await db.query(query, values);

        return res.json({
            status: 'success',
            total: rows.length,
            data: rows,
        });
    } catch (err) {
        console.error('getDzikir error:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

module.exports = {
    getDzikir,
};
