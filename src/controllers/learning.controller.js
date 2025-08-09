// src/controllers/learning.controller.js
const db = require('../config/db');

// Fungsi 1: Mengambil daftar Topik (menggantikan getLearningMaterials)
const getLearningTopics = async (req, res) => {
    try {
        const { category } = req.query;
        if (!category) {
            return res.status(400).json({ status: 'error', message: 'Parameter kategori wajib diisi.' });
        }
        const query = `
            SELECT * FROM learning_materials
            WHERE category = $1 AND is_active = true
            ORDER BY display_order ASC;
        `;
        const { rows } = await db.query(query, [category]);
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        console.error("Error di getLearningTopics:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

// Fungsi 2: Mengambil daftar Pelajaran di dalam sebuah Topik
const getLessonsByTopic = async (req, res) => {
    try {
        const { topicSlug } = req.params;
        let query;

        // Logika khusus jika topiknya adalah "Quranic Surahs"
        if (topicSlug === 'all') {
            query = {
                text: `
                    SELECT 
                        l.id as lesson_id,
                        s.id as surah_id,
                        s.name_simple,
                        s.name_translation_id,
                        s.image_url,
                        'OPEN_LESSON_STEPS' as action_type,
                        l.id::text as action_value
                    FROM lessons l
                    JOIN learning_materials m ON l.material_id = m.id
                    JOIN surahs s ON l.display_order = s.id
                    WHERE m.action_value = $1 AND l.is_active = true
                    ORDER BY s.id ASC;
                `,
                values: [topicSlug]
            };
        } else {
            // Logika umum untuk topik lain seperti "Hajj"
            query = {
                text: `
                    SELECT 
                        l.id as lesson_id,
                        l.title,
                        l.subtitle,
                        'OPEN_LESSON_STEPS' as action_type,
                        l.id::text as action_value
                    FROM lessons l
                    JOIN learning_materials m ON l.material_id = m.id
                    WHERE m.action_value = $1 AND l.is_active = true
                    ORDER BY l.display_order ASC;
                `,
                values: [topicSlug]
            };
        }

        const { rows } = await db.query(query);
        res.status(200).json({ status: 'success', data: rows });

    } catch (error) {
        console.error("Error di getLessonsByTopic:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

// Fungsi 3: Mengambil semua "slide" dari sebuah Pelajaran (tidak berubah)
const getLessonSteps = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const query = `
            SELECT * FROM lesson_steps
            WHERE lesson_id = $1 AND is_active = true
            ORDER BY step_order ASC;
        `;
        const { rows } = await db.query(query, [lessonId]);
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        console.error("Error di getLessonSteps:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

module.exports = {
    getLearningTopics,
    getLessonsByTopic,
    getLessonSteps
};
