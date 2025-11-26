const { Ayah, Surah, AyahViews } = require("../models");

exports.getPopularAyahs = async (req, res) => {
    try {
        const ayahs = await Ayah.findAll({
            include: [
                {
                    model: Surah,
                    attributes: ["name_simple", "name_translation_id"]
                },
                {
                    model: AyahViews,
                    attributes: ["total_views"]
                }
            ],
            order: [
                [AyahViews, "total_views", "DESC"]
            ],
            limit: 20
        });

        res.json({
            status: "success",
            count: ayahs.length,
            data: ayahs
        });

    } catch (error) {
        console.log("Popular ayahs error:", error);
        res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
};
