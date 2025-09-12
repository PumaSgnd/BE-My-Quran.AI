// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");

const isLoggedIn = (req, res, next) => {
  // 1. Cek session dulu
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // 2. Kalau nggak ada session, coba cek token
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({
      status: "error",
      message: "Tidak ada token atau session. Silakan login.",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Format token tidak valid",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(403).json({
      status: "error",
      message: "Token tidak valid atau kadaluarsa",
    });
  }
};

module.exports = { isLoggedIn };
