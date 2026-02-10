const db = require('../config/db');

// 1. Ambil daftar guide (Haji/Umrah)
const getHajjGuides = async (req, res) => {
    try {
        const { category } = req.query;

        let query = `
            SELECT *
            FROM hajj_guide
            WHERE is_active = true
        `;

        const values = [];

        if (category) {
            values.push(category);
            query += ` AND category = $${values.length}`;
        }

        query += ` ORDER BY display_order ASC`;

        const { rows } = await db.query(query, values);

        res.json({
            status: 'success',
            data: rows
        });

    } catch (error) {
        console.error("Error getHajjGuides:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};

// 2. Ambil steps guide
const getHajjGuideSteps = async (req, res) => {
    try {
        const { guideId } = req.params;

        const query = `
            SELECT *
            FROM guide_steps
            WHERE guide_id = $1
            AND is_active = true
            ORDER BY step_order ASC
        `;

        const { rows } = await db.query(query, [guideId]);

        res.json({
            status: 'success',
            data: rows
        });

    } catch (error) {
        console.error("Error getHajjGuideSteps:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error'
        });
    }
};


module.exports = {
    getHajjGuides,
    getHajjGuideSteps
};
