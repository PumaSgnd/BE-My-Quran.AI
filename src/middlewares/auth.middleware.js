// src/middlewares/auth.middleware.js
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next(); // Jika sudah login, lanjutkan
    }
    res.status(401).json({ status: 'error', message: 'Akses ditolak. Silakan login terlebih dahulu.' });
};

module.exports = { isLoggedIn };
