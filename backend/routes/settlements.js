const express = require('express');
const { protect } = require('../middleware/auth');
const { isTripMember } = require('../middleware/tripAccess');
const settlementController = require('../controllers/settlementController');

const router = express.Router();

router.use(protect);

// @route   GET  /api/settlements/trip/:tripId  — All settlements for a trip
// @route   POST /api/settlements/trip/:tripId  — Record a new settlement
router
  .route('/trip/:tripId')
  .get(isTripMember, settlementController.getSettlements)
  .post(isTripMember, settlementController.createSettlement);

// @route   POST /api/settlements/trip/:tripId/settle-all  — Settle all suggested debts
router.post(
  '/trip/:tripId/settle-all',
  isTripMember,
  settlementController.settleAll
);

// @route   POST /api/settlements/trip/:tripId/remind  — Nudge a member who owes money
router.post(
  '/trip/:tripId/remind',
  isTripMember,
  settlementController.remindSettlement
);

// @route   DELETE /api/settlements/:id  — Remove a settlement record
router.delete('/:id', settlementController.deleteSettlement);

module.exports = router;
