const { Ayah, Surah, AyahViews, sequelize } = require("../models");

exports.getPopular = async (req, res) => {
    try {
        const popularSurahs = await Ayah.findAll({
            include: [
                {
                    model: Surah,
                    attributes: ["id", "name_arabic", "name_translation_id"]
                },
                { model: AyahViews, attributes: [] }
            ],
            attributes: [
                "surah_number",
                [sequelize.fn("SUM", sequelize.col("AyahViews.total_views")), "total_views"]
            ],
            group: ["surah_number", "Surah.id"],
            order: [[sequelize.literal("total_views"), "DESC"]],
            limit: 10
        });

        const popularAyahs = await Ayah.findAll({
            include: [
                {
                    model: Surah,
                    attributes: ["id", "name_arabic", "name_translation_id"]
                },
                {
                    model: AyahViews,
                    attributes: ["total_views"]
                }
            ],
            order: [
                [AyahViews, "total_views", "DESC"]
            ],
            limit: 10
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
