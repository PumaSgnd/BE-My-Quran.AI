// src/routes/learning.routes.js
const express = require('express');
const router = express.Router();
const {
    getLearningTopics,
    getLessonsByTopic,
    getLessonSteps
} = require('../controllers/learning.controller.js');

// 1. Mengambil daftar Topik berdasarkan kategori
// Contoh: GET /api/v1/learning/topics?category=pelajaran
router.get('/topics', getLearningTopics);

// 2. Mengambil daftar Pelajaran di dalam sebuah Topik
// Contoh: GET /api/v1/learning/topics/all/lessons (untuk "Quranic Surahs")
// Contoh: GET /api/v1/learning/topics/hajj/lessons (untuk "Hajj")
router.get('/topics/:topicSlug/lessons', getLessonsByTopic);

// 3. Mengambil semua "slide" dari sebuah Pelajaran
// Contoh: GET /api/v1/learning/lessons/1/steps
router.get('/lessons/:lessonId/steps', getLessonSteps);

module.exports = router;
