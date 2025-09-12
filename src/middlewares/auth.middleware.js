const jwt = require("jsonwebtoken");

const isLoggedIn = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader) {
    return res.status(401).json({
      status: "error",
      message: "Tidak ada token. Silakan login.",
    });
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Format token tidak valid",
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not set!");
      return res.status(500).json({
        status: "error",
        message: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded;
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
