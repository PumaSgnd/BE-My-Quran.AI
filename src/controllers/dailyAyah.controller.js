// src/controllers/dailyAyah.controller.js
const db = require('../config/db');

const getDailyAyah = async (req, res) => {
    try {
        // 1. Dapatkan total jumlah ayat di database
        const countRes = await db.query('SELECT COUNT(*) FROM ayahs;');
        const totalAyahs = parseInt(countRes.rows[0].count, 10);

        // 2. Hitung jumlah hari sejak epoch (1 Jan 1970)
        // Ini akan menjadi "seed" kita yang berubah setiap hari
        const today = new Date();
        const epoch = new Date('1970-01-01');
        const daysSinceEpoch = Math.floor((today - epoch) / (1000 * 60 * 60 * 24));

        // 3. Tentukan ID ayat untuk hari ini secara matematis
        // +1 agar hasilnya tidak pernah 0 (karena ID ayat mulai dari 1)
        const targetAyahId = (daysSinceEpoch % totalAyahs) + 1;

        // 4. Ambil data lengkap untuk ayat tersebut
        // Kita gabungkan semua informasi: teks arab, terjemahan, nama surah, dan link audio
        const query = `
            SELECT 
                a.text AS arabic_text,
                t.translation_text,
                t.footnotes,
                s.name_simple AS surah_name,
                s.name_translation_id AS surah_translation,
                a.ayah_number,
                a.juz_number,
                a.verse_key,
                af.audio_url
            FROM 
                ayahs a
            JOIN 
                surahs s ON a.surah_number = s.id
            LEFT JOIN 
                translations t ON a.id = t.ayah_id AND t.author_name = 'Kemenag'
            LEFT JOIN 
                audio_files af ON a.surah_number = af.surah_id AND af.reciter_id = 1 -- Default ke Qari ID 1 (As-Sudais)
            WHERE 
                a.id = $1;
        `;

        const { rows } = await db.query(query, [targetAyahId]);

        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Gagal mendapatkan ayat harian.' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Ayat Harian',
            generated_at: today.toISOString(),
            data: rows[0]
        });

    } catch (error) {
        console.error("Error di getDailyAyah:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

module.exports = {
    getDailyAyah,
};
