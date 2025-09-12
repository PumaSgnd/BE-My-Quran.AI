const jwt = require("jsonwebtoken");

const isLoggedIn = (req, res, next) => {
  console.log(">>> Incoming headers:", req.headers); // debug

  // Cari header Authorization tanpa case-sensitive
  const authHeader =
    req.headers["authorization"] ||
    req.headers["Authorization"] ||
    Object.keys(req.headers)
      .find((k) => k.toLowerCase() === "authorization")
      ?.let((k) => req.headers[k]);

  console.log(">>> Parsed authHeader:", authHeader);

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
