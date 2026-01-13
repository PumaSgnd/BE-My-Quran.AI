const db = require('../config/db');
const STATUS = require('../utils/memorizationStatus');

const getAyahMemorizationBySurah = async (req, res) => {
    try {
        const userId = req.user.id;
        const surahId = Number(req.params.surahId);

        const { rows } = await db.query(
            `SELECT ayah_number, status
             FROM ayah_memorizations
             WHERE user_id = $1 AND surah_id = $2
             ORDER BY ayah_number ASC`,
            [userId, surahId]
        );

        return res.json({ status: 'success', data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const getMemorizationCounts = async (req, res) => {
    try {
        const userId = req.user.id;

        // TOTAL AYAT QUR'AN
        const totalResult = await db.query(
            `SELECT COUNT(*)::int AS total FROM ayahs`
        );
        const totalAyah = totalResult.rows[0].total;

        // AYAT YANG SUDAH ADA STATUS
        const { rows } = await db.query(
            `
            SELECT status, COUNT(*)::int AS total
            FROM ayah_memorizations
            WHERE user_id = $1
            GROUP BY status
            `,
            [userId]
        );

        let dihafalkan = 0;
        let latihan = 0;

        rows.forEach(row => {
            if (row.status === STATUS.MEMORIZED) {
                dihafalkan = row.total;
            }
            if (row.status === STATUS.NEED_PRACTICE) {
                latihan = row.total;
            }
        });

        const untukDihafalkan = totalAyah - (dihafalkan + latihan);

        return res.json({
            status: 'success',
            data: {
                dihafalkan,
                latihan,
                untuk_dihafalkan: Math.max(untukDihafalkan, 0),
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const setAyahMemorizationStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { surah_id, ayah_number, status } = req.body;

        if (!Object.values(STATUS).includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Status hafalan tidak valid',
            });
        }

        await db.query(
            `
            INSERT INTO ayah_memorizations (user_id, surah_id, ayah_number, status)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, surah_id, ayah_number)
            DO UPDATE SET
                status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP
            `,
            [userId, surah_id, ayah_number, status]
        );

        return res.json({
            status: 'success',
            message: 'Status hafalan berhasil diperbarui',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const deleteAyahMemorization = async (req, res) => {
    try {
        const userId = req.user.id;
        const { surah_id, ayah_number } = req.body;

        // cek status dulu
        const check = await db.query(
            `SELECT status
             FROM ayah_memorizations
             WHERE user_id = $1 AND surah_id = $2 AND ayah_number = $3`,
            [userId, surah_id, ayah_number]
        );

        if (check.rowCount === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Data hafalan tidak ditemukan',
            });
        }

        if (check.rows[0].status !== STATUS.MEMORIZED) {
            return res.status(403).json({
                status: 'error',
                message: 'Ayat hanya bisa dihapus jika statusnya Dihafalkan',
            });
        }

        await db.query(
            `DELETE FROM ayah_memorizations
             WHERE user_id = $1 AND surah_id = $2 AND ayah_number = $3`,
            [userId, surah_id, ayah_number]
        );

        return res.json({
            status: 'success',
            message: 'Ayat hafalan berhasil dihapus',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

module.exports = {
    getAyahMemorizationBySurah,
    getMemorizationCounts,
    setAyahMemorizationStatus,
    deleteAyahMemorization,
};
