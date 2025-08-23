// src/routes/learning.routes.js
const express = require('express');
const router = express.Router();

const {
    getLearningTopics,
    getLessonsByTopic,
    getLessonSteps,
} = require('../controllers/learning.controller.js');

/**
 * @openapi
 * /api/learning/topics:
 *   get:
 *     tags:
 *       - Learning
 *     summary: Daftar Topik berdasarkan kategori
 *     description: >
 *       Mengembalikan daftar topik (dari tabel "learning_materials") yang aktif untuk kategori tertentu.
 *       Wajib kirim query "category".
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         description: >
 *           Kategori topik (mis. "pelajaran").
 *         schema:
 *           type: string
 *           example: pelajaran
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Baris dari "learning_materials"
 *                     additionalProperties: true
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   data:
 *                     - id: 1
 *                       title: Quranic Surahs
 *                       subtitle: Belajar tiap surah
 *                       action_value: all
 *                       image_url: https://cdn.example/img/surah.jpg
 *                       category: pelajaran
 *                       is_active: true
 *                       display_order: 1
 *                     - id: 2
 *                       title: Hajj
 *                       subtitle: Manasik haji
 *                       action_value: hajj
 *                       image_url: https://cdn.example/img/hajj.jpg
 *                       category: pelajaran
 *                       is_active: true
 *                       display_order: 2
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/topics', getLearningTopics);

/**
 * @openapi
 * /api/learning/topics/{topicSlug}/lessons:
 *   get:
 *     tags:
 *       - Learning
 *     summary: Daftar Pelajaran dalam sebuah Topik
 *     description: >
 *       Mengembalikan daftar lesson untuk topik yang dipilih.
 *       Jika topicSlug = "all" maka mode khusus Quranic Surahs (bergabung ke tabel "surahs" dan menampilkan info surah).
 *       Selain itu (mis. "hajj") mode umum: judul/subtitle lesson.
 *
 *       Field yang selalu ada:
 *       - lesson_id, action_type (OPEN_LESSON_STEPS), action_value (string id lesson)
 *
 *       Field yang mungkin ada (tergantung topik):
 *       - Mode "all": surah_id, name_simple, name_translation_id, image_url
 *       - Mode lainnya: title, subtitle
 *     parameters:
 *       - in: path
 *         name: topicSlug
 *         required: true
 *         description: >
 *           Slug topik. Contoh: "all" untuk Quranic Surahs, "hajj" untuk topik Hajj.
 *         schema:
 *           type: string
 *           example: all
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *             examples:
 *               quranicSurahs:
 *                 summary: Jika topicSlug = "all" (Quranic Surahs)
 *                 value:
 *                   status: success
 *                   data:
 *                     - lesson_id: 101
 *                       surah_id: 1
 *                       name_simple: Al-Fatihah
 *                       name_translation_id: Pembukaan
 *                       image_url: https://cdn.example/surah/1.png
 *                       action_type: OPEN_LESSON_STEPS
 *                       action_value: "101"
 *                     - lesson_id: 102
 *                       surah_id: 2
 *                       name_simple: Al-Baqarah
 *                       name_translation_id: Sapi Betina
 *                       image_url: https://cdn.example/surah/2.png
 *                       action_type: OPEN_LESSON_STEPS
 *                       action_value: "102"
 *               hajj:
 *                 summary: Jika topicSlug lain (mis. "hajj")
 *                 value:
 *                   status: success
 *                   data:
 *                     - lesson_id: 201
 *                       title: Pengantar Haji
 *                       subtitle: Definisi dan syarat
 *                       action_type: OPEN_LESSON_STEPS
 *                       action_value: "201"
 *                     - lesson_id: 202
 *                       title: Rukun Haji
 *                       subtitle: Rukun wajib dipenuhi
 *                       action_type: OPEN_LESSON_STEPS
 *                       action_value: "202"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/topics/:topicSlug/lessons', getLessonsByTopic);

/**
 * @openapi
 * /api/learning/lessons/{lessonId}/steps:
 *   get:
 *     tags:
 *       - Learning
 *     summary: Semua step/slide dalam sebuah Pelajaran
 *     description: >
 *       Mengembalikan semua baris dari "lesson_steps" untuk "lessonId" tertentu (hanya yang aktif),
 *       diurutkan naik berdasarkan "step_order".
 *       Struktur kolom mengikuti tabel (controller melakukan SELECT *), jadi bisa berbeda-beda.
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         description: ID lesson
 *         schema:
 *           type: integer
 *           example: 101
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Baris dari "lesson_steps"
 *                     additionalProperties: true
 *             examples:
 *               ok:
 *                 value:
 *                   status: success
 *                   data:
 *                     - id: 1
 *                       lesson_id: 101
 *                       step_order: 1
 *                       title: Apa itu Al-Fatihah?
 *                       content_md: Al-Fatihah adalah pembukaan Al-Qur'an...
 *                       media_url: null
 *                       type: text
 *                       is_active: true
 *                     - id: 2
 *                       lesson_id: 101
 *                       step_order: 2
 *                       title: Keutamaan
 *                       content_md: Memiliki kedudukan istimewa dalam shalat...
 *                       media_url: https://cdn.example/video/intro.mp4
 *                       type: video
 *                       is_active: true
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/lessons/:lessonId/steps', getLessonSteps);

module.exports = router;
