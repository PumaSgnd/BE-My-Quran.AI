// src/index.js

// --- IMPORT SEMUA PAKET ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
require('./config/passport-setup'); // Import konfigurasi passport

// --- INISIALISASI APLIKASI EXPRESS ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'quran-api-secret-key', // Simpan ini di .env!
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Ganti jadi true jika pakai HTTPS
}));

// Inisialisasi Passport
app.use(passport.initialize());
app.use(passport.session());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Terlalu banyak request, coba lagi dalam 15 menit',
});
app.use(limiter);

// --- ROUTES ---
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Fondasi Backend Quran API sudah siap!',
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});


// ------------------------------
const surahRoutes = require('./routes/surah.routes.js');
app.use('/api/surahs', surahRoutes);
// ------------------------------

// ------------------------------
const juzRoutes = require('./routes/juz.routes.js');
app.use('/api/juz', juzRoutes);
// ------------------------------

// ------------------------------
const reciterRoutes = require('./routes/reciter.routes.js');
app.use('/api/reciters', reciterRoutes);
// ------------------------------


const dailyAyahRoutes = require('./routes/dailyAyah.routes.js');
app.use('/api/daily-ayah', dailyAyahRoutes);


// --- RUTE BARU UNTUK AUTENTIKASI ---
const authRoutes = require('./routes/auth.routes.js'); // Akan kita buat
app.use('/api/auth', authRoutes);

// --- RUTE BARU UNTUK BOOKMARK (DILINDUNGI) ---
const bookmarkRoutes = require('./routes/bookmark.routes.js'); // Akan kita buat
app.use('/api/bookmarks', bookmarkRoutes);

// --- TAMBAHKAN DUA BARIS INI ---
const lastReadRoutes = require('./routes/lastRead.routes.js');
app.use('/api/last-read', lastReadRoutes);
// ------------------------------

const contentRoutes = require('./routes/content.routes.js');
app.use('/api/content', contentRoutes);

// --- TAMBAHKAN DUA BARIS INI ---
const learningRoutes = require('./routes/learning.routes.js');
app.use('/api/learning', learningRoutes);
// ------------------------------



// --- PENANGANAN ERROR ---
// Handle 404 - Rute tidak ditemukan
app.use((req, res, next) => {
    res.status(404).json({
        status: 'Error',
        message: 'Resource tidak ditemukan',
    });
});

// Handle error server (middleware dengan 4 argumen)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'Error',
        message: 'Terjadi kesalahan pada server',
    });
});


// --- MULAI SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan dengan gagah di http://localhost:${PORT}`);
});
