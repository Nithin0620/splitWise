const express = require('express');
const passport = require('passport');
const { protect } = require('../middleware/auth');
const { sendTokenResponse } = require('../utils/token');

const router = express.Router();

// Only allow deep links back into our own apps. This prevents the OAuth
// `redirectUri`/`state` parameter from being abused as an open redirect.
const ALLOWED_REDIRECT_PROTOCOLS = ['splitwise:', 'exp:', 'exps:', 'exp+splitwise:'];

function isAllowedRedirect(uri) {
  try {
    return ALLOWED_REDIRECT_PROTOCOLS.includes(new URL(uri).protocol);
  } catch (_) {
    return false;
  }
}

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth flow
router.get(
  '/google',
  (req, res, next) => {
    const { redirectUri } = req.query;

    // Carry the client's redirect URI (custom scheme for dev/standalone
    // builds, exp:// for Expo Go) through Google via the `state` param.
    // Google echoes `state` back verbatim to the callback.
    const state =
      redirectUri && isAllowedRedirect(redirectUri)
        ? Buffer.from(redirectUri).toString('base64url')
        : undefined;

    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      state,
    })(req, res, next);
  }
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback — issues JWT and redirects
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`, session: false }),
  (req, res) => {
    const { generateToken } = require('../utils/token');
    const token = generateToken(req.user._id);

    // Web fallback: send the user back to the web app.
    let redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${token}`;

    // If the client supplied a redirect URI, it was carried through Google in
    // `state`. Decode it and send the token back to the app (Expo Go: exp://,
    // dev/standalone build: splitwise://).
    if (req.query.state) {
      try {
        const mobileRedirect = Buffer.from(
          req.query.state,
          'base64url'
        ).toString('utf8');

        if (isAllowedRedirect(mobileRedirect)) {
          const url = new URL(mobileRedirect);
          url.searchParams.set('token', token);
          redirectUrl = url.toString();
        }
      } catch (_) {
        // Ignore malformed state and fall back to the web app.
      }
    }

    res.redirect(redirectUrl);
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
