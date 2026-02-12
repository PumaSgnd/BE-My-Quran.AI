const db = require('../config/db');

const createPlan = async (req, res) => {
    const userId = req.user.id;
    const { target_date, reading_type } = req.body;

    try {
        const activeCheck = await db.query(`
      SELECT id FROM khatam_plan
      WHERE user_id=$1 AND status='active'
    `, [userId]);

        if (activeCheck.rows.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Masih ada plan aktif'
            });
        }
        const totalKhatam = await db.query(`
      SELECT COUNT(*) FROM khatam_plan
      WHERE user_id=$1
    `, [userId]);

        const khatamNumber = parseInt(totalKhatam.rows[0].count) + 1;

        await db.query(`
      INSERT INTO khatam_plan
      (user_id, khatam_number, start_date, target_date, reading_type)
      VALUES ($1, $2, CURRENT_DATE, $3, $4)
    `, [userId, khatamNumber, target_date, reading_type]);

        res.json({
            status: 'success',
            message: `Plan khatam ke-${khatamNumber} berhasil dibuat`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const updatePlan = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, target_date } = req.body;

    try {
        const check = await db.query(`
      SELECT * FROM khatam_plan
      WHERE id=$1 AND user_id=$2 AND status='active'
    `, [id, userId]);

        if (!check.rows.length) {
            return res.status(404).json({
                status: 'error',
                message: 'Plan tidak ditemukan'
            });
        }
        const fields = [];
        const values = [];
        let index = 1;

        if (title) {
            fields.push(`title=$${index++}`);
            values.push(title);
        }

        if (target_date) {
            fields.push(`target_date=$${index++}`);
            values.push(target_date);
        }

        if (!fields.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Tidak ada data yang diupdate'
            });
        }

        values.push(id);
        values.push(userId);

        await db.query(`
      UPDATE khatam_plan
      SET ${fields.join(', ')}
      WHERE id=$${index++} AND user_id=$${index}
    `, values);

        res.json({
            status: 'success',
            message: 'Plan berhasil diperbarui'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const getActivePlan = async (req, res) => {
    const userId = req.user.id;

    try {

        const plan = await db.query(`
      SELECT * FROM khatam_plan
      WHERE user_id=$1 AND status='active'
      LIMIT 1
    `, [userId]);

        if (!plan.rows.length) {
            return res.json({ data: null });
        }

        const planData = plan.rows[0];
        const progress = await db.query(`
      SELECT COUNT(DISTINCT juz) as total_juz
      FROM khatam_progress
      WHERE khatam_id=$1
    `, [planData.id]);

        const lastJuz = parseInt(progress.rows[0].total_juz) || 0;
        if (lastJuz >= 30) {
            await db.query(`
        UPDATE khatam_plan
        SET status='completed',
            completed_at=CURRENT_TIMESTAMP
        WHERE id=$1
      `, [planData.id]);

            planData.status = 'completed';
        }

        const targetDate = new Date(planData.target_date);
        const now = new Date();

        const remainingDays =
            Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));

        res.json({
            ...planData,
            last_juz_read: lastJuz,
            progress_percent: (lastJuz / 30) * 100,
            remaining_days: remainingDays
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const getHistory = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query(`
      SELECT id, khatam_number, start_date, completed_at
      FROM khatam_plan
      WHERE user_id=$1 AND status='completed'
      ORDER BY completed_at DESC
    `, [userId]);

        res.json({
            status: 'success',
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

const deletePlan = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        await db.query(`
      DELETE FROM khatam_plan
      WHERE id=$1 AND user_id=$2
    `, [id, userId]);

        res.json({
            status: 'success',
            message: 'Plan dihapus'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
};

module.exports = {
    createPlan, 
    updatePlan,
    getActivePlan,
    getHistory,
    deletePlan
};
