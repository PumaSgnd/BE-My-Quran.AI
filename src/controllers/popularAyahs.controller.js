const { Ayah, Surah, AyahViews, Translation, sequelize } = require("../models");

exports.getPopular = async (req, res) => {
    try {
        // ✅ Popular Surah berdasarkan jumlah ayah di surah (pakai verses_count)
        const popularSurahs = await Ayah.findAll({
            include: [
                {
                    model: Surah,
                    attributes: [
                        "id",
                        "name",
                        "name_translation_id",
                        "name_arabic",
                        "verses_count"
                    ]
                }
            ],
            attributes: [
                "surah_number",
                [sequelize.fn("COUNT", sequelize.col("Ayah.id")), "ayah_count"]
            ],
            group: ["surah_number", "Surah.id"],
            order: [[sequelize.literal("ayah_count"), "DESC"]],
            limit: 5
        });

        // ✅ Popular Ayat berdasarkan total views
        const popularAyahs = await Ayah.findAll({
            include: [
                {
                    model: Surah,
                    attributes: [
                        "id",
                        "name",
                        "name_arabic",
                        "name_translation_id"
                    ]
                },
                {
                    model: AyahViews,
                    attributes: ["total_views"]
                },
                {
                    model: Translation,
                    as: "Translations",
                    attributes: ["translation_text"]
                }
            ],
            order: [[AyahViews, "total_views", "DESC"]],
            limit: 3
        });

        res.json({
            status: "success",
            popular_surahs: popularSurahs,
            popular_ayahs: popularAyahs
        });

    } catch (error) {
        console.log("Popular error:", error);
        res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
};
