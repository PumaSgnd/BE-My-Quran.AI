const jwt = require("jsonwebtoken");

const isLoggedIn = (req, res, next) => {
  // Debug: lihat headers yang masuk
  console.log(">>> Incoming headers:", req.headers);

  // Cek header: Authorization atau x-access-token
  let authHeader =
    req.headers["authorization"] ||
    req.headers["Authorization"] ||
    req.headers["x-access-token"];

  // Jika tidak ada token
  if (!authHeader) {
    return res.status(401).json({
      status: "error",
      message: "Tidak ada token. Silakan login.",
    });
  }

  // Ambil token tanpa "Bearer " prefix
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Format token tidak valid",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(">>> JWT verified:", decoded);
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(403).json({
      status: "error",
      message: "Token tidak valid atau kadaluarsa",
    });
  }
};

module.exports = { isLoggedIn };
