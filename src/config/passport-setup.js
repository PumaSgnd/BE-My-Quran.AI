// src/config/passport-setup.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const { Pool } = require("pg");

console.log("🚀 passport-setup.js loaded");

// --- Database Pool ---
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL belum diset di environment!");
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Vercel PostgreSQL butuh SSL
});

// --- Ensure users table ---
const ensureUsersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        provider TEXT NOT NULL,
        provider_id TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ users table checked/created");
  } catch (err) {
    console.error("❌ Gagal bikin tabel users:", err.message);
  }
};
ensureUsersTable();

// --- Serialize / Deserialize User ---
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

// --- Google Strategy ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "https://be-my-quran-ai.vercel.app/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || null;
          const result = await pool.query(
            "SELECT * FROM users WHERE provider = $1 AND provider_id = $2",
            ["google", profile.id]
          );

          if (result.rows.length > 0) {
            return done(null, result.rows[0]);
          }

          const insert = await pool.query(
            "INSERT INTO users (provider, provider_id, display_name, email) VALUES ($1,$2,$3,$4) RETURNING *",
            ["google", profile.id, profile.displayName, email]
          );

          return done(null, insert.rows[0]);
        } catch (err) {
          console.error("❌ Error Google Strategy:", err.message);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.error("⚠️ GOOGLE_CLIENT_ID atau GOOGLE_CLIENT_SECRET belum diset!");
}

// --- Facebook Strategy ---
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL:
          process.env.FACEBOOK_CALLBACK_URL ||
          "https://be-my-quran-ai.vercel.app/api/auth/facebook/callback",
        profileFields: ["id", "displayName", "emails"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || null;
          const result = await pool.query(
            "SELECT * FROM users WHERE provider = $1 AND provider_id = $2",
            ["facebook", profile.id]
          );

          if (result.rows.length > 0) {
            return done(null, result.rows[0]);
          }

          const insert = await pool.query(
            "INSERT INTO users (provider, provider_id, display_name, email) VALUES ($1,$2,$3,$4) RETURNING *",
            ["facebook", profile.id, profile.displayName, email]
          );

          return done(null, insert.rows[0]);
        } catch (err) {
          console.error("❌ Error Facebook Strategy:", err.message);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.error("⚠️ FACEBOOK_APP_ID atau FACEBOOK_APP_SECRET belum diset!");
}

module.exports = passport;
