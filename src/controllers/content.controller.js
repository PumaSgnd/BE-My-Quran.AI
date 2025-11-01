const db = require('../config/db');

// Fungsi pembantu untuk mengganti URL gambar ke file lokal
const mapLocalImages = (data) => {
    if (!data) return null;

    const localImages = {
        OPEN_URL_1: '/uploads/temukan/artikel1.png',
        OPEN_URL_2: '/uploads/temukan/artikel2.png',
        OPEN_URL_3: '/uploads/temukan/artikel3.png',
        OPEN_LEARN_SECTION: '/uploads/temukan/belajar.png',
        OPEN_MEMORIZE_SECTION: '/uploads/temukan/menghafalkan.png',
        DEEP_DIVE_AYAH: '/uploads/temukan/selami.png',
        OPEN_LAST_READ: '/uploads/temukan/baca.png',
        OPEN_ARTICLE: '/uploads/temukan/ibadahharian.png',
        OPEN_DAILY_AYAH: '/uploads/temukan/ayatharian.png',
    };

    // Untuk 3 banner pertama (OPEN_URL)
    if (data.action_type === 'OPEN_URL') {
        if (data.display_order === 1) data.image_url = localImages.OPEN_URL_1;
        else if (data.display_order === 2) data.image_url = localImages.OPEN_URL_2;
        else if (data.display_order === 3) data.image_url = localImages.OPEN_URL_3;
    } 
    // Untuk kartu utama
    else if (localImages[data.action_type]) {
        data.image_url = localImages[data.action_type];
    }

    return data;
};

const getTemukanPageContent = async (req, res) => {
    try {
        // Jalankan semua query secara paralel
        const queries = [
            db.query("SELECT * FROM featured_content WHERE screen_location = 'temukan_banner' AND is_active = true ORDER BY display_order ASC"),
            db.query("SELECT * FROM featured_content WHERE action_type = 'OPEN_LEARN_SECTION' AND is_active = true LIMIT 1"),
            db.query("SELECT * FROM featured_content WHERE action_type = 'OPEN_MEMORIZE_SECTION' AND is_active = true LIMIT 1"),
            db.query("SELECT * FROM featured_content WHERE action_type = 'DEEP_DIVE_AYAH' AND is_active = true LIMIT 1"),
            db.query("SELECT * FROM featured_content WHERE action_type = 'OPEN_LAST_READ' AND is_active = true LIMIT 1"),
            db.query("SELECT * FROM featured_content WHERE action_type = 'OPEN_ARTICLE' AND action_value = 'doa-malaikat' AND is_active = true LIMIT 1"),
            db.query("SELECT * FROM featured_content WHERE action_type = 'OPEN_DAILY_AYAH' AND is_active = true LIMIT 1")
        ];

        const results = await Promise.all(queries);

        // Terapkan mapping ke setiap hasil
        const responseData = {
            banners: results[0].rows.map(mapLocalImages),
            belajar: mapLocalImages(results[1].rows[0]),
            menghafalkan: mapLocalImages(results[2].rows[0]),
            selami_lebih_dalam: mapLocalImages(results[3].rows[0]),
            baca: mapLocalImages(results[4].rows[0]),
            ibadah_harian: mapLocalImages(results[5].rows[0]),
            ayat_harian: mapLocalImages(results[6].rows[0]),
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
