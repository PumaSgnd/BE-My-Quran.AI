// src/routes/prayer.routes.js
const express = require('express');
const { query, param, body } = require('express-validator');
const { validate } = require('../middlewares/validate');
const C = require('../controllers/prayer.controller');

const router = express.Router();

// Validators
const vLat = query('lat').exists().withMessage('lat wajib').isFloat({ min: -90, max: 90 }).toFloat();
const vLng = query('lng').exists().withMessage('lng wajib').isFloat({ min: -180, max: 180 }).toFloat();
const vTz = query('tz').exists().withMessage('tz wajib').isString().trim();
const vMethod = query('method').optional().isString();
const vMadhab = query('madhab').optional().isIn(['Shafi', 'Hanafi']);
const vHlr = query('hlr').optional().isIn(['MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle']);

/**
 * @openapi
 * /prayer/today:
 *   get:
 *     tags: [Prayer Times]
 *     summary: Jadwal sholat untuk hari ini (atau tanggal tertentu via query `date`)
 *     description: Menghitung jadwal sholat berdasarkan lat/lng/tz dan parameter metode. Jika `date` tidak diberikan, dipakai tanggal hari ini pada zona waktu `tz`.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, minimum: -90, maximum: 90, example: -6.9175 }
 *         description: Garis lintang.
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, minimum: -180, maximum: 180, example: 107.6191 }
 *         description: Garis bujur.
 *       - in: query
 *         name: tz
 *         required: true
 *         schema: { type: string, example: Asia/Jakarta }
 *         description: IANA Time Zone (wajib).
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [MWL, UmmAlQura, ISNA, Egypt, Moonsighting, Dubai, Qatar, Kuwait, Singapore, Turkey, JAKIM]
 *           example: MWL
 *       - in: query
 *         name: madhab
 *         schema: { type: string, enum: [Shafi, Hanafi], example: Shafi }
 *       - in: query
 *         name: hlr
 *         schema: { type: string, enum: [MiddleOfTheNight, SeventhOfTheNight, TwilightAngle], example: MiddleOfTheNight }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date, example: "2025-06-11" }
 *         description: Tanggal (YYYY-MM-DD). Default = hari ini di TZ yang diberikan.
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   generated_at: "2025-06-11T02:01:22.000Z"
 *                   data:
 *                     date: { gregorian: "2025-06-11", hijri: "15 Dzulhijjah 1446" }
 *                     location: { lat: -6.9175, lng: 107.6191, tz: "Asia/Jakarta" }
 *                     method: "MWL"
 *                     madhab: "Shafi"
 *                     hlr: "MiddleOfTheNight"
 *                     times:
 *                       imsak: "04:26"
 *                       fajr: "04:36"
 *                       sunrise: "05:51"
 *                       dhuhr: "11:52"
 *                       asr: "15:13"
 *                       maghrib: "17:47"
 *                       isha: "18:58"
 *                     current: { name: "Asr", started_at: "15:13", ends_at: "17:47" }
 *                     next:    { name: "Maghrib", at: "17:47", in_seconds: 9072 }
 *       422:
 *         description: Validasi gagal (parameter tidak lengkap/invalid)
 *         content:
 *           application/json:
 *             examples:
 *               invalid:
 *                 value:
 *                   status: error
 *                   errors:
 *                     - { path: "lat", msg: "Invalid value", location: "query" }
 *       500:
 *         description: Server error
 */
router.get('/today', validate([vLat, vLng, vTz, vMethod, vMadhab, vHlr, query('date').optional().isISO8601()]), C.getToday);

/**
 * @openapi
 * /prayer/date/{date}:
 *   get:
 *     tags: [Prayer Times]
 *     summary: Jadwal sholat pada tanggal tertentu
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: "2025-06-11" }
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, minimum: -90, maximum: 90, example: -6.9175 }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, minimum: -180, maximum: 180, example: 107.6191 }
 *       - in: query
 *         name: tz
 *         required: true
 *         schema: { type: string, example: Asia/Jakarta }
 *       - in: query
 *         name: method
 *         schema: { type: string, example: MWL }
 *       - in: query
 *         name: madhab
 *         schema: { type: string, enum: [Shafi, Hanafi], example: Shafi }
 *       - in: query
 *         name: hlr
 *         schema: { type: string, enum: [MiddleOfTheNight, SeventhOfTheNight, TwilightAngle], example: MiddleOfTheNight }
 *     responses:
 *       200:
 *         description: OK
 *       422:
 *         description: Validasi gagal (lat/lng/tz wajib)
 *       500:
 *         description: Server error
 */
router.get('/date/:date', validate([vLat, vLng, vTz, vMethod, vMadhab, vHlr, param('date').isISO8601()]), C.getDate);

/**
 * @openapi
 * /prayer/week:
 *   get:
 *     tags: [Prayer Times]
 *     summary: Jadwal sholat 7 hari berturut-turut
 *     description: Jika `start` tidak diberikan, server memakai awal minggu (TZ user) sebagai default.
 *     parameters:
 *       - in: query
 *         name: start
 *         schema: { type: string, format: date, example: "2025-06-09" }
 *         description: Tanggal awal rentang (YYYY-MM-DD).
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, example: -6.9175 }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, example: 107.6191 }
 *       - in: query
 *         name: tz
 *         required: true
 *         schema: { type: string, example: Asia/Jakarta }
 *       - in: query
 *         name: method
 *         schema: { type: string, example: MWL }
 *       - in: query
 *         name: madhab
 *         schema: { type: string, enum: [Shafi, Hanafi], example: Shafi }
 *       - in: query
 *         name: hlr
 *         schema: { type: string, enum: [MiddleOfTheNight, SeventhOfTheNight, TwilightAngle], example: MiddleOfTheNight }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   generated_at: "2025-06-11T02:01:22.000Z"
 *                   data:
 *                     - { date: { gregorian: "2025-06-09", hijri: "13 Dzulhijjah 1446" }, times: { fajr: "04:36", sunrise: "05:51", dhuhr: "11:52", asr: "15:13", maghrib: "17:47", isha: "18:58", imsak: "04:26" } }
 *                     - { date: { gregorian: "2025-06-10", hijri: "14 Dzulhijjah 1446" }, times: { fajr: "04:36", sunrise: "05:51", dhuhr: "11:52", asr: "15:13", maghrib: "17:47", isha: "18:58", imsak: "04:26" } }
 *       422: { description: Validasi gagal }
 */
router.get('/week', validate([vLat, vLng, vTz, vMethod, vMadhab, vHlr, query('start').optional().isISO8601()]), C.getWeek);

/**
 * @openapi
 * /prayer/month:
 *   get:
 *     tags: [Prayer Times]
 *     summary: Jadwal sholat 1 bulan penuh
 *     description: Jika `month` tidak diberikan, server memakai bulan berjalan (TZ user).
 *     parameters:
 *       - in: query
 *         name: month
 *         schema: { type: string, pattern: '^\d{4}-\d{2}$', example: "2025-06" }
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, example: -6.9175 }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, example: 107.6191 }
 *       - in: query
 *         name: tz
 *         required: true
 *         schema: { type: string, example: Asia/Jakarta }
 *       - in: query
 *         name: method
 *         schema: { type: string, example: MWL }
 *       - in: query
 *         name: madhab
 *         schema: { type: string, enum: [Shafi, Hanafi], example: Shafi }
 *       - in: query
 *         name: hlr
 *         schema: { type: string, enum: [MiddleOfTheNight, SeventhOfTheNight, TwilightAngle], example: MiddleOfTheNight }
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/month', validate([vLat, vLng, vTz, vMethod, vMadhab, vHlr, query('month').optional().matches(/^\d{4}-\d{2}$/)]), C.getMonth);

/**
 * @openapi
 * /prayer/next:
 *   get:
 *     tags: [Prayer Times]
 *     summary: Waktu sholat berikutnya dari timestamp tertentu (default sekarang)
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time, example: "2025-06-11T15:05:00" }
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, example: -6.9175 }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, example: 107.6191 }
 *       - in: query
 *         name: tz
 *         required: true
 *         schema: { type: string, example: Asia/Jakarta }
 *       - in: query
 *         name: method
 *         schema: { type: string, example: MWL }
 *       - in: query
 *         name: madhab
 *         schema: { type: string, enum: [Shafi, Hanafi], example: Shafi }
 *       - in: query
 *         name: hlr
 *         schema: { type: string, enum: [MiddleOfTheNight, SeventhOfTheNight, TwilightAngle], example: MiddleOfTheNight }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   generated_at: "2025-06-11T08:10:00.000Z"
 *                   data:
 *                     date: { gregorian: "2025-06-11", hijri: "15 Dzulhijjah 1446" }
 *                     next: { name: "Maghrib", at: "17:47", in_seconds: 5400 }
 */
router.get('/next', validate([vLat, vLng, vTz, vMethod, vMadhab, vHlr, query('from').optional().isISO8601()]), C.getNext);

/**
 * @openapi
 * /prayer/prefs:
 *   get:
 *     tags: [Prayer Times]
 *     summary: Ambil preferensi user (opsional auth)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   data:
 *                     method: MWL
 *                     madhab: Shafi
 *                     hlr: MiddleOfTheNight
 *                     offsets: { imsak: -10, fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
 *                     adhan: { fajr: { enabled: true, voice: "mishary" } }
 *       500: { description: Server error }
 */
router.get('/prefs', C.getPrefs);

/**
 * @openapi
 * /prayer/prefs:
 *   post:
 *     tags: [Prayer Times]
 *     summary: Simpan preferensi user (opsional auth)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method: { type: string, example: MWL }
 *               madhab: { type: string, enum: [Shafi, Hanafi], example: Shafi }
 *               hlr:    { type: string, enum: [MiddleOfTheNight, SeventhOfTheNight, TwilightAngle], example: MiddleOfTheNight }
 *               offsets:
 *                 type: object
 *                 additionalProperties: { type: integer }
 *                 example: { imsak: -10, fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
 *               adhan:
 *                 type: object
 *                 additionalProperties: true
 *                 example: { fajr: { enabled: true, voice: "mishary" }, maghrib: { enabled: false } }
 *     responses:
 *       200:
 *         description: Preferensi disimpan
 *         content:
 *           application/json:
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   message: Preferensi disimpan
 *                   data:
 *                     method: MWL
 *                     madhab: Shafi
 *                     hlr: MiddleOfTheNight
 *                     offsets: { imsak: -10, fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
 *                     adhan: { fajr: { enabled: true, voice: "mishary" } }
 *       422: { description: Validasi gagal }
 *       500: { description: Server error }
 */
router.post('/prefs', validate([
    body('method').optional().isString(),
    body('madhab').optional().isIn(['Shafi', 'Hanafi']),
    body('hlr').optional().isIn(['MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle']),
    body('offsets').optional().isObject(),
    body('adhan').optional().isObject(),
]), C.setPrefs);

module.exports = router;
