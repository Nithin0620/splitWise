const express = require('express');
const { protect } = require('../middleware/auth');
const { getRest } = require('../config/ably');

const router = express.Router();

// @route   GET /api/realtime/token
// @access  Private
router.get('/token', protect, async (req, res) => {
  const rest = getRest();

  if (!rest) {
    return res.status(503).json({ message: 'Realtime is not configured' });
  }

  const tokenRequest = await rest.auth.createTokenRequest({
    clientId: String(req.user._id),
    capability: {
      'trip:*': ['subscribe'],
    },
    ttl: 60 * 60 * 1000,
  });

  res.set('Cache-Control', 'no-store');
  res.json(tokenRequest);
});

module.exports = router;
