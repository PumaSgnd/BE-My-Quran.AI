// src/services/profile.service.js
const db = require('../config/db');

async function getMe(userId) {
  const sql = `
    SELECT id, provider, provider_id, display_name, email, created_at, updated_at, photo
    FROM users
    WHERE id = $1
    LIMIT 1
  `;
  const { rows } = await db.query(sql, [userId]);
  return rows[0] || null;
}

async function updateMe(userId, { display_name, photo }) {
  const sets = [];
  const params = [];
  let i = 1;

  if (typeof display_name !== 'undefined') {
    sets.push(`display_name = $${i++}`);
    params.push(display_name);
  }
  if (typeof photo !== 'undefined') {
    sets.push(`photo = $${i++}`);
    params.push(photo);
  }

  if (sets.length === 0) {
    return getMe(userId); // ga ada field diupdate
  }

  const sql = `
    UPDATE users
    SET ${sets.join(', ')}, updated_at = NOW()
    WHERE id = $${i}
    RETURNING id, provider, provider_id, display_name, email, created_at, updated_at, photo
  `;
  params.push(userId);

  const { rows } = await db.query(sql, params);
  return rows[0] || null;
}

module.exports = { getMe, updateMe };
