// src/routes/chat.routes.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const OpenAI = require("openai");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt biar fokus ke Islam
const SYSTEM_PROMPT = `
Anda adalah "My-Quran.AI", asisten yang HANYA menjawab pertanyaan tentang Islam.
- Jika pertanyaan tidak berkaitan dengan Islam, jawab: 
  "Maaf, saya hanya dapat membantu pertanyaan yang berkaitan dengan Islam."
- Gunakan Bahasa Indonesia yang santun.
- Jika butuh tafsir mendalam/fatwa, arahkan user untuk bertanya pada ulama.
`;

async function saveMessage(userId, sessionId, role, content) {
  const sql = `
    INSERT INTO messages (user_id, session_id, role, content, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id
  `;
  await pool.query(sql, [userId, sessionId, role, content]);
}

async function loadRecentMessages(userId, sessionId, limit = 10) {
  const sql = `
    SELECT role, content FROM messages
    WHERE user_id = $1 AND session_id = $2
    ORDER BY created_at DESC LIMIT $3
  `;
  const res = await pool.query(sql, [userId, sessionId, limit]);
  return res.rows.reverse();
}

router.post("/", async (req, res) => {
  const { message, sessionId = "default", userId } = req.body;
  if (!message || !userId) {
    return res.status(400).json({ error: "Field 'message' dan 'userId' wajib ada" });
  }

  try {
    await saveMessage(userId, sessionId, "user", message);
    const history = await loadRecentMessages(userId, sessionId, 8);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.2,
      max_tokens: 800,
    });

    const reply = completion.choices[0].message.content;

    // ✅ FIX: tambahkan userId di sini
    await saveMessage(userId, sessionId, "assistant", reply);

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  const { userId, sessionId = "default" } = req.query;

  if (!userId) return res.status(400).json({ error: "userId wajib ada" });

  try {
    const sql = `
      SELECT id, role, content, created_at
      FROM messages
      WHERE user_id = $1 AND session_id = $2
      ORDER BY created_at ASC
    `;
    const result = await pool.query(sql, [userId, sessionId]);
    res.json({ messages: result.rows });
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Gagal mengambil riwayat chat" });
  }
});

module.exports = router;
