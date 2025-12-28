const db = require("../config/db");

const Article = {
  create: async ({ title, content, source, hashtags }) => {
    const query = `
      INSERT INTO articles (title, content, source, hashtags)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [title, content, source, hashtags];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  findAll: async () => {
    const { rows } = await db.query(
      "SELECT * FROM articles ORDER BY created_at DESC"
    );
    return rows;
  },

  findById: async (id) => {
    const { rows } = await db.query(
      "SELECT * FROM articles WHERE id = $1",
      [id]
    );
    return rows[0];
  },

  delete: async (id) => {
    await db.query("DELETE FROM articles WHERE id = $1", [id]);
  }
};

module.exports = Article;
