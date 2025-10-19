const pool = require("../db.js");

// ✅ GET semua data user (kelompokkan per hari)
const getWeeklyPrayers = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM weekly_prayers WHERE user_id = $1 ORDER BY day_of_week, id",
      [userId]
    );

    // Bentuk data per hari
    const grouped = result.rows.reduce((acc, row) => {
      if (!acc[row.day_of_week]) acc[row.day_of_week] = [];
      acc[row.day_of_week].push(row);
      return acc;
    }, {});

    res.json({ status: "success", data: grouped });
  } catch (err) {
    console.error("Error GET /weekly:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch weekly prayers",
      error: err.message,
    });
  }
};

// ✅ TOGGLE (Create/Delete)
const toggleWeeklyPrayer = async (req, res) => {
  try {
    const { user_id, day_of_week, prayer_name } = req.body;

    // Cek apakah data sudah ada
    const check = await pool.query(
      "SELECT * FROM weekly_prayers WHERE user_id = $1 AND day_of_week = $2 AND prayer_name = $3",
      [user_id, day_of_week, prayer_name]
    );

    if (check.rows.length > 0) {
      // Jika sudah ada → hapus (toggle off)
      await pool.query("DELETE FROM weekly_prayers WHERE id = $1", [
        check.rows[0].id,
      ]);

      return res.json({
        status: "success",
        message: `Deactivated ${prayer_name} on ${day_of_week}`,
      });
    } else {
      // Jika belum ada → insert (toggle on)
      const insert = await pool.query(
        "INSERT INTO weekly_prayers (user_id, day_of_week, prayer_name, is_active) VALUES ($1, $2, $3, TRUE) RETURNING *",
        [user_id, day_of_week, prayer_name]
      );

      return res.json({
        status: "success",
        message: `Activated ${prayer_name} on ${day_of_week}`,
        data: insert.rows[0],
      });
    }
  } catch (err) {
    console.error("Error POST /weekly:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to toggle weekly prayer",
      error: err.message,
    });
  }
};

module.exports = {
  getWeeklyPrayers,
  toggleWeeklyPrayer,
};
