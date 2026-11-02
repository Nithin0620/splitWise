const Settlement = require('../models/Settlement');
const Trip = require('../models/Trip');
const { publishTripEvent } = require('../config/ably');

// @desc    Get all settlements for a trip
// @route   GET /api/settlements/trip/:tripId
// @access  Private (trip member)
const getSettlements = async (req, res) => {
  const settlements = await Settlement.find({ trip: req.params.tripId })
    .populate('fromUser', 'name email avatar')
    .populate('toUser', 'name email avatar')
    .sort({ settledAt: -1 });

  res.json({ success: true, data: settlements });
};

// @desc    Record a new settlement in a trip
// @route   POST /api/settlements/trip/:tripId
// @access  Private (trip member)
const createSettlement = async (req, res) => {
  const { fromUser, toUser, amount, notes, settledAt } = req.body;

  if (!fromUser || !toUser || !amount) {
    return res.status(400).json({ message: 'fromUser, toUser, and amount are required' });
  }

  if (fromUser === toUser) {
    return res.status(400).json({ message: 'fromUser and toUser cannot be the same person' });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than 0' });
  }

  const trip = req.trip; // attached by isTripMember middleware

  // Verify both users are members of the trip
  const fromIsMember = trip.members.some((m) => m.toString() === fromUser.toString());
  const toIsMember = trip.members.some((m) => m.toString() === toUser.toString());

  if (!fromIsMember) {
    return res.status(400).json({ message: 'fromUser is not a member of this trip' });
  }
  if (!toIsMember) {
    return res.status(400).json({ message: 'toUser is not a member of this trip' });
  }

  const settlement = await Settlement.create({
    trip: trip._id,
    fromUser,
    toUser,
    amount,
    notes: notes || '',
    settledAt: settledAt || Date.now(),
  });

  await settlement.populate('fromUser', 'name email avatar');
  await settlement.populate('toUser', 'name email avatar');

  // Notify all members in the trip room
  await publishTripEvent(trip._id, 'settlement_created', { settlement });

  res.status(201).json({ success: true, data: settlement });
};

// @desc    Delete a settlement record
// @route   DELETE /api/settlements/:id
// @access  Private (the fromUser who recorded the payment)
const deleteSettlement = async (req, res) => {
  const settlement = await Settlement.findById(req.params.id);

  if (!settlement) {
    return res.status(404).json({ message: 'Settlement not found' });
  }

  // Only the person who made the payment (fromUser) can delete it,
  // or a trip owner — checked below via trip membership
  const trip = await Trip.findById(settlement.trip);
  if (!trip) {
    return res.status(404).json({ message: 'Associated trip not found' });
  }

  const isMember = trip.members.some((m) => m.toString() === req.user._id.toString());
  if (!isMember) {
    return res.status(403).json({ message: 'You are not a member of this trip' });
  }

  const isFromUser = settlement.fromUser.toString() === req.user._id.toString();
  const isOwner = trip.createdBy.toString() === req.user._id.toString();

  if (!isFromUser && !isOwner) {
    return res.status(403).json({ message: 'Only the payer or trip owner can delete this settlement' });
  }

  const tripId = settlement.trip;
  const settlementId = settlement._id;

  await settlement.deleteOne();

  // Notify the trip room
  await publishTripEvent(tripId, 'settlement_deleted', { settlementId, tripId });

  res.json({ success: true, message: 'Settlement deleted' });
};

module.exports = {
  getSettlements,
  createSettlement,
  deleteSettlement,
};
