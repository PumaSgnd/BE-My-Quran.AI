// src/docs/openapi.js
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Quran API',
            version: '1.0.0',
            description: 'Dokumentasi endpoint untuk FE (Quran App)',
        },
        servers: [{ url: '/api', description: 'Base API' }],
        tags: [
            { name: 'Auth', description: 'OAuth (redirect), session cookie, profile & logout' },
            { name: 'Surah', description: 'Daftar surah & ayat' },
            { name: 'Juz', description: 'Daftar juz & ayat per juz' },
            { name: 'Reciters', description: 'Qari & audio per surah' },
            { name: 'DailyAyah', description: 'Ayat harian' },
            { name: 'Bookmarks', description: 'Manajemen bookmark (butuh login)' },
            { name: 'LastRead', description: 'Posisi terakhir dibaca (butuh login)' },
            { name: 'Content', description: 'Konten penunjang/temukan' },
            { name: 'Learning', description: 'Topik/lesson pembelajaran' },
            { name: 'Tajwid', description: 'Data tajwid spans per ayat' },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'connect.sid',
                    description:
                        'Session cookie dari express-session. Login via OAuth (redirect) di browser, lalu /auth/profile bisa di-Try dari Swagger.',
                },
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string', example: 'OK' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'error' },
                        message: { type: 'string', example: 'Terjadi kesalahan pada server' },
                    },
                },
                PaginationMeta: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 20 },
                        total: { type: 'integer', example: 346 },
                        totalPages: { type: 'integer', example: 18 },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        provider: { type: 'string', example: 'google' },
                        provider_id: { type: 'string', example: '108032807703254427138' },
                        display_name: { type: 'string', example: 'Surya' },
                        email: { type: 'string', nullable: true, example: 'suryanurjaman91@gmail.com' },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                    required: ['id', 'provider', 'provider_id', 'display_name'],
                },
                Surah: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        number: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Al-Fatihah' },
                        ayahs_count: { type: 'integer', example: 7 },
                    },
                },
                Ayah: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        ayah_number: { type: 'integer', example: 1 },
                        verse_key: { type: 'string', example: '1:1' },
                        text_ar: { type: 'string', example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
                        tajwid_spans: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    start: { type: 'integer', example: 7 },
                                    end: { type: 'integer', example: 8 },
                                    rule: { type: 'string', example: 'ham_wasl' },
                                },
                            },
                        },
                    },
                },
                Bookmark: {
                    type: 'object',
                    properties: {
                        bookmark_id: { type: 'integer', example: 12 },
                        id: { type: 'integer', example: 3456, description: 'ayah.id' },
                        surah_number: { type: 'integer', example: 2 },
                        ayah_number: { type: 'integer', example: 255 },
                        verse_key: { type: 'string', example: '2:255' },
                        text: { type: 'string', example: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ...' },
                        juz_number: { type: 'integer', example: 3 },
                        surah_name: { type: 'string', example: 'Al-Baqarah' },
                    },
                },
            },
            responses: {
                Unauthorized: {
                    description: 'Belum login / session tidak ada',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            examples: { e: { value: { status: 'error', message: 'Tidak ada user yang login' } } },
                        },
                    },
                },
                BadRequest: {
                    description: 'Request tidak valid',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            examples: { e: { value: { status: 'error', message: 'Parameter tidak valid' } } },
                        },
                    },
                },
                NotFound: {
                    description: 'Resource tidak ditemukan',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            examples: { e: { value: { status: 'error', message: 'Resource tidak ditemukan' } } },
                        },
                    },
                },
                InternalServerError: {
                    description: 'Kesalahan server',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
                RedirectToProvider: { description: 'Redirect ke halaman OAuth Provider (302)' },
                RedirectToProfile: { description: 'Redirect ke /api/auth/profile (302)' },
            },
        },
    },
    // scan semua route JSDoc
    apis: [path.join(__dirname, '../routes/*.js')],
};

const openapiSpec = swaggerJsdoc(options);
module.exports = openapiSpec;
