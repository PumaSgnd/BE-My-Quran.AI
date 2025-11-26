const { Surah, Ayah, AyahViews, Translation } = require("../models");

exports.getPopular = async (req, res) => {
    try {
        // ✅ Popular Surah berdasarkan verses_count
        const popularSurahs = await Surah.findAll({
            attributes: [
                "id",
                "name",
                "name_translation_id",
                "name_arabic",
                "name_simple",
                "verses_count"
            ],
            order: [["verses_count", "DESC"]],
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
                        "name_simple",
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
