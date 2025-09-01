// src/controllers/profile.controller.js
const { getMe, updateMe } = require('../services/profile.service');

exports.getMyProfile = async (req, res, next) => {
    try {
        const me = await getMe(req.user.id); // req.user dari Passport session
        if (!me) {
            return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
        }
        return res.json({ status: 'success', data: me });
    } catch (err) {
        next(err);
    }
};

exports.updateMyProfile = async (req, res, next) => {
    try {
        const payload = {
            display_name: req.body.display_name,
            photo: req.body.photo,
        };

        const updated = await updateMe(req.user.id, payload);
        return res.json({ status: 'success', data: updated });
    } catch (err) {
        next(err);
    }
};
