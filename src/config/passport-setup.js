// src/config/passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('./db');

// PENTING: Dapatkan kredensial ini dari Google Cloud Console & Facebook for Developers
// Simpan di file .env kamu!
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Menyimpan user ID ke dalam session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Mengambil data user dari session berdasarkan ID
passport.deserializeUser(async (id, done) => {
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, rows[0]);
    } catch (error) {
        done(error, null);
    }
});

// Konfigurasi Strategi Google
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/v1/auth/google/callback" // URL callback
}, async (accessToken, refreshToken, profile, done) => {
    // Fungsi ini berjalan setelah user berhasil login di Google
    try {
        // Cek apakah user sudah ada di database kita
        const { rows } = await db.query('SELECT * FROM users WHERE provider = $1 AND provider_id = $2', ['google', profile.id]);

        if (rows.length > 0) {
            // Jika sudah ada, langsung lanjutkan
            return done(null, rows[0]);
        } else {
            // Jika belum ada, buat user baru di database
            const newUserQuery = `
                INSERT INTO users (provider, provider_id, display_name, email)
                VALUES ($1, $2, $3, $4) RETURNING *;
            `;
            const newUser = await db.query(newUserQuery, ['google', profile.id, profile.displayName, profile.emails[0].value]);
            return done(null, newUser.rows[0]);
        }
    } catch (error) {
        return done(error, null);
    }
}));

// Konfigurasi Strategi Facebook
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "/api/v1/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails']
}, async (accessToken, refreshToken, profile, done) => {
    // Logika yang sama seperti Google
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE provider = $1 AND provider_id = $2', ['facebook', profile.id]);

        if (rows.length > 0) {
            return done(null, rows[0]);
        } else {
            const newUserQuery = `
                INSERT INTO users (provider, provider_id, display_name, email)
                VALUES ($1, $2, $3, $4) RETURNING *;
            `;
            const newUser = await db.query(newUserQuery, ['facebook', profile.id, profile.displayName, profile.emails ? profile.emails[0].value : null]);
            return done(null, newUser.rows[0]);
        }
    } catch (error) {
        return done(error, null);
    }
}));
