const pool = require('../config/db');

// GET semua data weekly user
exports.getWeekly = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT date, shalat_name, is_active 
       FROM prayer_weekly 
       WHERE user_id = $1 
       ORDER BY date ASC`,
      [userId]
    );

    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('❌ GET Weekly Error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// CREATE / TOGGLE shalat done
exports.toggleShalat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, shalat_name } = req.body;

    const existing = await pool.query(
      `SELECT id FROM prayer_weekly 
       WHERE user_id = $1 AND date = $2 AND shalat_name = $3`,
      [userId, date, shalat_name]
    );

    if (existing.rows.length > 0) {
      // DELETE jika sudah ada
      await pool.query(
        `DELETE FROM prayer_weekly 
         WHERE user_id = $1 AND date = $2 AND shalat_name = $3`,
        [userId, date, shalat_name]
      );
      return res.json({ status: 'success', action: 'deleted' });
    } else {
      // INSERT jika belum ada
      await pool.query(
        `INSERT INTO prayer_weekly (user_id, date, shalat_name, is_active)
         VALUES ($1, $2, $3, TRUE)`,
        [userId, date, shalat_name]
      );
      return res.json({ status: 'success', action: 'created' });
    }
  } catch (err) {
    console.error('❌ POST Weekly Error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// DELETE satu entri manual (opsional)
exports.deleteShalat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, shalat_name } = req.body;

    await pool.query(
      `DELETE FROM prayer_weekly 
       WHERE user_id = $1 AND date = $2 AND shalat_name = $3`,
      [userId, date, shalat_name]
    );

    res.json({ status: 'success', message: 'deleted' });
  } catch (err) {
    console.error('❌ DELETE Weekly Error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
};
