const express = require('express');
const passport = require('passport');
const { protect } = require('../middleware/auth');
const { sendTokenResponse } = require('../utils/token');

const router = express.Router();

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth flow
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback — issues JWT and redirects
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`, session: false }),
  (req, res) => {
    const { generateToken } = require('../utils/token');
    const token = generateToken(req.user._id);

    // Redirect to frontend with token in query param
    // Frontend stores this in localStorage/cookie
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
});

// @route   POST /api/auth/logout
// @desc    Clear auth cookie
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
