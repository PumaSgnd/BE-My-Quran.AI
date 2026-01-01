const db = require("../config/db");

const Article = {
  create: async ({ title, content, source, hashtags, images }) => {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const articleQuery = `
        INSERT INTO articles (title, content, source, hashtags)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const articleValues = [title, content, source, hashtags];
      const { rows } = await client.query(articleQuery, articleValues);
      const article = rows[0];

      if (images && images.length) {
        const imageQuery = `
          INSERT INTO article_images (article_id, image_url, width, height)
          VALUES ($1, $2, $3, $4)
        `;
        for (const img of images) {
          await client.query(imageQuery, [
            article.id,
            img.url,
            img.width,
            img.height
          ]);
        }
      }

      await client.query("COMMIT");
      return article;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  findAll: async () => {
    const { rows } = await db.query(`
      SELECT 
        a.*,
        COALESCE(
          json_agg(
            json_build_object(
              'url', i.image_url,
              'width', i.width,
              'height', i.height
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS images
      FROM articles a
      LEFT JOIN article_images i ON i.article_id = a.id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);
    return rows;
  },

  findById: async (id) => {
    const { rows } = await db.query(
      `
      SELECT 
        a.*,
        COALESCE(
          json_agg(
            json_build_object(
              'url', i.image_url,
              'width', i.width,
              'height', i.height
            )
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS images
      FROM articles a
      LEFT JOIN article_images i ON i.article_id = a.id
      WHERE a.id = $1
      GROUP BY a.id
      `,
      [id]
    );
    return rows[0];
  },

  delete: async (id) => {
    await db.query("DELETE FROM articles WHERE id = $1", [id]);
  }
};

module.exports = Article;
