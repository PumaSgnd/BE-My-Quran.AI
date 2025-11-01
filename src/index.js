// src/index.js
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');
require('./config/passport-setup');

const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const ORIGINS = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(compression());
app.use(cors({
    origin: ORIGINS.length ? ORIGINS : true,
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

app.use(session({
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'quran-api-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
}));
app.use(passport.initialize());
app.use(passport.session());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Terlalu banyak request, coba lagi dalam 15 menit',
  keyGenerator: (req) => {
    // Ambil IP pertama dari x-forwarded-for, fallback ke remoteAddress, terakhir ke loopback
    if (req.headers['x-forwarded-for']) {
      return req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    return req.socket?.remoteAddress || '127.0.0.1';
  },
});
app.use(limiter);

app.get('/', (_req, res) => {
    res.json({
        message: '🚀 Fondasi Backend Quran API sudah siap!',
        status: 'OK',
        timestamp: new Date().toISOString(),
    });
});

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
app.use(express.static(path.join(__dirname, '../public')));
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
app.use('/api/videos', require('./routes/video.routes'));

app.use('/api/profile', require('./routes/profile.routes.js'));
app.use('/api/chat', require('./routes/chat.routes.js'));
app.use("/api/doa", require('./routes/doa.routes.js'));
app.use('/api/doa-user', require('./routes/doaUser.routes.js'));
app.use('/api/prayer', require('./routes/prayer.routes.js'));
app.use('/api/prayer-weekly', require('./routes/weeklyPrayer.routes.js'));

// temukan image
app.use('/uploads', express.static('public/uploads'));

app.use((_req, res) => {
    res.status(404).json({ status: 'Error', message: 'Resource tidak ditemukan' });
});
app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Terjadi kesalahan pada server';
    if (!isProd) console.error(err);
    res.status(status).json({ status: 'Error', message });
});

module.exports = app;
