// src/config/passport-setup.js
// Daftarin strategi Passport: Google & Facebook + serialize/deserialize user (PostgreSQL)
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Pool } = require('pg');

// Wajib ada DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL belum diset di environment!");
}

// Pool PostgreSQL (Railway / Supabase / Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // penting untuk Vercel/Railway
});

// Buat table users kalau belum ada (sederhana)
const ensureUsersTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      email TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};
ensureUsersTable().catch(err => {
  console.error('Gagal membuat tabel users:', err);
});

// Helper: ambil/insert user berdasarkan provider & provider_id
async function findOrCreateUser({ provider, provider_id, display_name, email }) {
  const selectRes = await pool.query(
    'SELECT id, provider, provider_id, display_name, email, created_at FROM users WHERE provider = $1 AND provider_id = $2 LIMIT 1',
    [provider, provider_id]
  );
  if (selectRes.rows.length > 0) {
    return selectRes.rows[0];
  }
  const insertRes = await pool.query(
    `INSERT INTO users (provider, provider_id, display_name, email)
     VALUES ($1, $2, $3, $4)
     RETURNING id, provider, provider_id, display_name, email, created_at`,
    [provider, provider_id, display_name, email]
  );
  return insertRes.rows[0];
}

// ---- Serialize & deserialize session ----
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query(
      'SELECT id, provider, provider_id, display_name, email, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    if (res.rows.length === 0) return done(null, false);
    return done(null, res.rows[0]);
  } catch (err) {
    return done(err);
  }
});

// ---- Google OAuth2 Strategy ----
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL,
} = process.env;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const display_name = profile.displayName || 'Google User';
          const email = Array.isArray(profile.emails) && profile.emails.length
            ? profile.emails[0].value
            : null;

          const user = await findOrCreateUser({
            provider: 'google',
            provider_id: profile.id,
            display_name,
            email,
          });

          return done(null, user);
        } catch (err) {
          console.error('GoogleStrategy error:', err);
          return done(err);
        }
      }
    )
  );
  console.log('✅ Passport: Google strategy registered');
} else {
  console.warn('⚠️  Passport: Google strategy NOT registered (cek GOOGLE_* env)');
}

// ---- Facebook OAuth Strategy ----
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET && FACEBOOK_CALLBACK_URL) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'emails'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const display_name = profile.displayName || 'Facebook User';
          const email = Array.isArray(profile.emails) && profile.emails.length
            ? profile.emails[0].value
            : null;

          const user = await findOrCreateUser({
            provider: 'facebook',
            provider_id: profile.id,
            display_name,
            email,
          });

          return done(null, user);
        } catch (err) {
          console.error('FacebookStrategy error:', err);
          return done(err);
        }
      }
    )
  );
  console.log('✅ Passport: Facebook strategy registered');
} else {
  console.warn('⚠️  Passport: Facebook strategy NOT registered (cek FACEBOOK_* env)');
}
