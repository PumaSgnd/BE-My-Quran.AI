// src/routes/chat.routes.js
const express = require("express");
const db = require("../config/db");
const OpenAI = require("openai");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
Anda adalah "My-Quran.AI", asisten yang HANYA menjawab pertanyaan tentang Islam.
- Jika pertanyaan tidak berkaitan dengan Islam, jawab:
  "Maaf, saya hanya dapat membantu pertanyaan yang berkaitan dengan Islam."
- Gunakan Bahasa Indonesia yang santun.
- Jika butuh tafsir mendalam/fatwa, arahkan user untuk bertanya pada ulama.
`;


async function saveMessage({
  userId,
  sessionId,
  role,
  content,
  parentMessageId = null,
  edited = false
}) {
  const sql = `
    INSERT INTO messages
    (user_id, session_id, role, content, parent_message_id, edited, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,NOW())
    RETURNING id
  `;

  const { rows } = await db.query(sql, [
    userId,
    sessionId,
    role,
    content,
    parentMessageId,
    edited
  ]);

  return rows[0].id;
}

async function loadRecentMessages(userId, sessionId, limit = 8) {
  const sql = `
    SELECT role, content
    FROM messages
    WHERE user_id = $1
      AND session_id = $2
    ORDER BY created_at DESC
    LIMIT $3
  `;

  const { rows } = await db.query(sql, [userId, sessionId, limit]);
  return rows.reverse();
}

router.post("/", async (req, res) => {
  const { message, userId, sessionId = "default" } = req.body;

  if (!message || !userId) {
    return res.status(400).json({
      error: "Field 'message' dan 'userId' wajib ada"
    });
  }

  try {
    await saveMessage({ userId, sessionId, role: "user", content: message });

    const history = await loadRecentMessages(userId, sessionId);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history
      ],
      temperature: 0.2,
      max_tokens: 800
    });

    const reply = completion.choices[0].message.content;

    await saveMessage({
      userId,
      sessionId,
      role: "assistant",
      content: reply
    });

    res.json({ reply });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/edit", async (req, res) => {
  const { messageId, newContent, userId, sessionId = "default" } = req.body;

  if (!messageId || !newContent || !userId) {
    return res.status(400).json({
      error: "messageId, newContent, userId wajib ada"
    });
  }

  try {
    await saveMessage({
      userId,
      sessionId,
      role: "user",
      content: newContent,
      parentMessageId: messageId,
      edited: true
    });

    const history = await loadRecentMessages(userId, sessionId);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history
      ],
      temperature: 0.2,
      max_tokens: 800
    });

    const reply = completion.choices[0].message.content;

    await saveMessage({
      userId,
      sessionId,
      role: "assistant",
      content: reply
    });

    res.json({ reply });

  } catch (err) {
    console.error("Edit chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  const { userId, sessionId = "default" } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId wajib ada" });
  }

  try {
    const sql = `
      SELECT
        id,
        role,
        content,
        edited,
        parent_message_id,
        created_at
      FROM messages
      WHERE user_id = $1
        AND session_id = $2
      ORDER BY created_at ASC
    `;

    const { rows } = await db.query(sql, [userId, sessionId]);
    res.json({ messages: rows });

  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ error: "Gagal mengambil riwayat chat" });
  }
});

module.exports = router;
