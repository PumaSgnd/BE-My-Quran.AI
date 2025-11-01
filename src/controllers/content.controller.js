// src/controllers/content.controller.js
const db = require('../config/db');

const getTemukanPageContent = async (req, res) => {
    try {
        // Kita akan menjalankan semua query ini secara bersamaan untuk efisiensi
        const queries = [
            // Query 1: Ambil semua banner
            db.query("SELECT * FROM featured_content WHERE screen_location = 'temukan_banner' AND is_active = true ORDER BY display_order ASC"),

            // Query 2: Ambil kartu "Belajar"
            db.query("SELECT * FROM featured_content WHERE action_type = 'OPEN_LEARN_SECTION' AND is_active = true LIMIT 1"),

            // Query 3: Ambil kartu "Menghafalkan"
            db.query("SELECT * FROM featured_content WHERE action_type = 'OPEN_MEMORIZE_SECTION' AND is_active = true LIMIT 1"),

            // Query 4: Ambil kartu "Selami lebih dalam"
            db.query("SELECT * FROM featured_content WHERE action_type = 'DEEP_DIVE_AYAH' AND is_active = true LIMIT 1"),

            // Query 5: Ambil kartu "Baca"
            db.query("SELECT * FROM featured_content WHERE action_type = 'OPEN_LAST_READ' AND is_active = true LIMIT 1"),

            // Query 6: Ambil kartu "Ibadah Harian"
            db.query("SELECT * FROM featured_content WHERE action_type = 'OPEN_ARTICLE' AND action_value = 'doa-malaikat' AND is_active = true LIMIT 1"),

            // Query 7: Ambil kartu "Ayat Harian"
            db.query("SELECT * FROM featured_content WHERE action_type = 'OPEN_DAILY_AYAH' AND is_active = true LIMIT 1")
        ];

        // Jalankan semua query secara paralel
        const results = await Promise.all(queries);

        // Susun hasilnya ke dalam format JSON yang rapi
        const responseData = {
            banners: results[0].rows,
            belajar: results[1].rows[0] || null,
            menghafalkan: results[2].rows[0] || null,
            selami_lebih_dalam: results[3].rows[0] || null,
            baca: results[4].rows[0] || null,
            ibadah_harian: results[5].rows[0] || null,
            ayat_harian: results[6].rows[0] || null,
        };

        res.status(200).json({
            status: 'success',
            data: responseData
        });

    } catch (error) {
        console.error("Error di getTemukanPageContent:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

module.exports = { getTemukanPageContent };
