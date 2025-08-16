// src/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const compression = require('compression');
require('./config/passport-setup');

const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi');

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';
const ORIGINS = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

// jika di belakang proxy (Vercel/Render/Nginx), aktifkan ini
app.set('trust proxy', 1);

// -------- middlewares umum --------
app.use(compression());

app.use(cors({
    origin: ORIGINS.length ? ORIGINS : true, // dev: izinkan semua
    credentials: true,
}));

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// session + passport
app.use(session({
    name: 'connect.sid', // sesuaikan dgn components.securitySchemes.cookieAuth
    secret: process.env.SESSION_SECRET || 'quran-api-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProd,                    // wajib true di production (HTTPS)
        sameSite: isProd ? 'none' : 'lax', // penting untuk OAuth cross-site
        maxAge: 1000 * 60 * 60 * 24 * 7,   // 7 hari
    },
}));
app.use(passport.initialize());
app.use(passport.session());

// rate limiting dasar
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Terlalu banyak request, coba lagi dalam 15 menit',
});
app.use(limiter);

// -------- healthcheck --------
app.get('/', (_req, res) => {
    res.json({
        message: '🚀 Fondasi Backend Quran API sudah siap!',
        status: 'OK',
        timestamp: new Date().toISOString(),
    });
});

// -------- Swagger Docs --------
// Penting: include cookie saat Try it out agar endpoint yg protected bekerja setelah login via browser
const swaggerUiOptions = {
    customSiteTitle: 'Quran API Docs',
    swaggerOptions: {
        docExpansion: 'list',
        defaultModelsExpandDepth: 0,
        defaultModelExpandDepth: 1,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        requestInterceptor: (req) => {
            req.credentials = 'include';
            return req;
        },
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
    },
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, swaggerUiOptions));
app.get('/docs.json', (_req, res) => res.json(openapiSpec));

// -------- routes --------
app.use('/api/surahs', require('./routes/surah.routes.js'));
app.use('/api/surahs', require('./routes/surahView.routes.js'));
app.use('/api/juz', require('./routes/juz.routes.js'));
app.use('/api/reciters', require('./routes/reciter.routes.js'));
app.use('/api/daily-ayah', require('./routes/dailyAyah.routes.js'));
app.use('/api/auth', require('./routes/auth.routes.js'));
app.use('/api/bookmarks', require('./routes/bookmark.routes.js'));
app.use('/api/last-read', require('./routes/lastRead.routes.js'));
app.use('/api/content', require('./routes/content.routes.js'));
app.use('/api/learning', require('./routes/learning.routes.js'));
app.use('/api/tajwid', require('./routes/tajwid.routes.js'));

// -------- 404 & error handler --------
app.use((_req, res) => {
    res.status(404).json({ status: 'Error', message: 'Resource tidak ditemukan' });
});
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'Error', message: 'Terjadi kesalahan pada server' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📄 Docs: http://localhost:${PORT}/docs`);
});
