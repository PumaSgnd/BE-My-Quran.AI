const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables!");
}

// ===== GOOGLE LOGIN =====
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/profile', session: false }),
  (req, res) => {
    console.log("DEBUG req.user =", req.user);

    try {
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.display_name,
          created_at: req.user.created_at || req.user.updated_at || new Date().toISOString(),
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const redirectUrl = `myquranai://auth/success?token=${token}`;
      res.redirect(redirectUrl);
    } catch (err) {
      console.error("JWT error:", err);
      res.status(500).json({ status: "error", message: "Gagal bikin token" });
    }
  }
);

// ===== FACEBOOK LOGIN =====
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['public_profile', 'email'], session: false })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: 'myquranai://auth/failed', session: false }),
  (req, res) => {
    // const createdAt = new Date().toISOString();
    console.log("DEBUG req.user =", req.user);
    
    try{
      const token = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          name: req.user.display_name,
          photo: req.user.photo,
          // created_at: createdAt,
          created_at: req.user.created_at || req.user.updated_at || new Date().toISOString(),
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      const redirectUrl = `myquranai://auth/success?token=${token}`;
      res.redirect(redirectUrl);
    } catch (err) {
      console.error("JWT error:", err);
      res.status(500).json({ status: "error", message: "Gagal bikin token" });
    }
  }
);

// ===== REFRESH TOKEN =====
router.post('/refresh', (req, res) => {
  try {
    const oldToken = req.headers['x-access-token'];
    if (!oldToken) {
      return res.status(401).json({ status: "error", message: "No token" });
    }

    const decoded = jwt.verify(oldToken, JWT_SECRET);

    const newToken = jwt.sign(
      {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        photo: decoded.photo,
        created_at: decoded.created_at,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      status: "success",
      token: newToken,
    });
  } catch (err) {
    return res.status(401).json({
      status: "error",
      message: "Token invalid or expired",
    });
  }
});

// ===== PROFILE =====
router.get('/profile', (req, res) => {
  if (req.user) {
    return res.json({ status: 'success', user: req.user });
  }
  res.status(401).json({ status: 'error', message: 'Tidak ada user yang login' });
});

// ===== LOGOUT =====
// Karena stateless pakai JWT, logout cukup di sisi client (hapus token).
router.get('/logout', (req, res) => {
  res.json({ status: 'success', message: 'Logout cukup hapus token di client' });
});

module.exports = router;
