const express = require('express');
const { protect } = require('../middleware/auth');
const { isTripMember, isTripOwner } = require('../middleware/tripAccess');
const tripController = require('../controllers/tripController');

const router = express.Router();

// All trip routes require auth
router.use(protect);

// @route   GET  /api/trips          — Get all trips for current user
// @route   POST /api/trips          — Create a new trip
router.route('/').get(tripController.getTrips).post(tripController.createTrip);

// @route   GET    /api/trips/:id    — Get single trip details
// @route   PUT    /api/trips/:id    — Update trip
// @route   DELETE /api/trips/:id    — Delete trip (owner only)
router
  .route('/:id')
  .get(isTripMember, tripController.getTrip)
  .put(isTripOwner, tripController.updateTrip)
  .delete(isTripOwner, tripController.deleteTrip);

// @route   POST   /api/trips/:id/members          — Add member by email
// @route   DELETE /api/trips/:id/members/:userId  — Remove member
router.post('/:id/members', isTripOwner, tripController.addMember);
router.delete('/:id/members/:userId', isTripOwner, tripController.removeMember);

// @route   GET /api/trips/:id/balances  — Get balance summary for trip
router.get('/:id/balances', isTripMember, tripController.getTripBalances);

// @route   GET /api/trips/:id/insights  — Spending insights for trip
router.get('/:id/insights', isTripMember, tripController.getTripInsights);

module.exports = router;
