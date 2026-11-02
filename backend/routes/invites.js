const express = require('express');
const { protect } = require('../middleware/auth');
const {
  sendInvite,
  acceptInvite,
  listInvites,
  cancelInvite,
  previewInvite,
} = require('../controllers/inviteController');

const router = express.Router();

// @route   GET  /api/invites/preview?token=xxx
// @desc    Get trip preview info from a token (public — for the accept page)
// @access  Public
router.get('/preview', previewInvite);

// All routes below require auth
router.use(protect);

// @route   POST   /api/invites/trips/:tripId  — Send invite email
// @route   GET    /api/invites/trips/:tripId  — List all invites for a trip
router
  .route('/trips/:tripId')
  .post(sendInvite)
  .get(listInvites);

// @route   POST   /api/invites/accept         — Accept invite with token
router.post('/accept', acceptInvite);

// @route   DELETE /api/invites/:inviteId      — Cancel a pending invite
router.delete('/:inviteId', cancelInvite);

module.exports = router;
