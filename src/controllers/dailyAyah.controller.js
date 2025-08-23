// src/controllers/dailyAyah.controller.js
const service = require('../services/dailyAyah.service');

const getDailyAyah = async (req, res) => {
    const payload = await service.getDailyAyah(req.dailyAyahOpts);
    return res.status(200).json({
        status: 'success',
        message: 'Ayat Harian',
        generated_at: new Date().toISOString(),
        data: payload,
    });
};

module.exports = { getDailyAyah };
