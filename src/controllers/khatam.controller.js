const db = require('../config/db');

const createPlan = async (req, res) => {
  const userId = req.user.id;
  const { target_date, reading_type } = req.body;

  try {
    await db.query(`
      INSERT INTO khatam_plan
      (user_id, start_date, target_date, reading_type)
      VALUES ($1, CURRENT_DATE, $2, $3)
    `, [userId, target_date, reading_type]);

    res.json({
      status: 'success',
      message: 'Plan khatam berhasil dibuat'
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
      WHERE user_id = $1 AND status='active'
      LIMIT 1
    `, [userId]);

    if (!plan.rows.length)
      return res.json({ data: null });

    const progress = await db.query(`
      SELECT a.juz_number
      FROM last_read_multi lr
      JOIN ayahs a ON lr.ayah_id = a.id
      WHERE lr.user_id = $1
      ORDER BY lr.updated_at DESC
      LIMIT 1
    `, [userId]);

    const lastJuz = progress.rows[0]?.juz_number || 0;

    const targetDate = new Date(plan.rows[0].target_date);
    const now = new Date();

    const remainingDays =
      Math.ceil((targetDate - now) / (1000*60*60*24));

    res.json({
      ...plan.rows[0],
      last_juz_read: lastJuz,
      progress_percent: (lastJuz/30)*100,
      remaining_days: remainingDays
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
    const result = await db.query(`
      DELETE FROM khatam_plan
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [id, userId]);

    if (!result.rows.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Plan tidak ditemukan'
      });
    }

    res.json({
      status: 'success',
      message: 'Plan khatam berhasil dihapus'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error'
    });
  }
};

module.exports = { createPlan, getActivePlan, deletePlan };