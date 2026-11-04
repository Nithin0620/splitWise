const Settlement = require('../models/Settlement');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { computeTripBalances } = require('../utils/balanceCalculator');
const { publishTripEvent } = require('../config/ably');
const { sendSettlementReminderEmail } = require('../utils/email');
const { createNotifications, notifyTripMembers } = require('../utils/notifications');

const resolveId = (value) => String(value?._id ?? value ?? '');
const round2 = (n) => Math.round(Number(n) * 100) / 100;

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

  const actor = String(req.user._id);
  const counterpart = actor === String(fromUser)
    ? settlement.toUser._id
    : actor === String(toUser)
      ? settlement.fromUser._id
      : null;
  await createNotifications({
    userIds: counterpart ? [counterpart] : [settlement.fromUser._id, settlement.toUser._id],
    trip: trip._id,
    type: 'settlement_recorded',
    title: 'Payment recorded',
    body: `${req.user.name} recorded ${settlement.fromUser.name} → ${settlement.toUser.name}: ${trip.currency} ${round2(amount)}`,
    data: { tripId: trip._id, settlementId: settlement._id },
  });

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
  await notifyTripMembers(trip, req.user._id, {
    type: 'settlement_deleted',
    title: 'Payment removed',
    body: `${req.user.name} removed a recorded payment`,
    data: { tripId, settlementId },
  });

  res.json({ success: true, message: 'Settlement deleted' });
};

// @desc    Settle multiple (or all suggested) transactions in one request
// @route   POST /api/settlements/trip/:tripId/settle-all
// @access  Private (trip member)
const settleAll = async (req, res) => {
  const trip = req.trip;
  const memberIds = new Set(trip.members.map((m) => String(m)));

  let transactions = req.body?.transactions;
  if (!Array.isArray(transactions) || transactions.length === 0) {
    const [expenses, settlements] = await Promise.all([
      Expense.find({ trip: trip._id }),
      Settlement.find({ trip: trip._id }),
    ]);
    transactions = computeTripBalances(expenses, settlements, { simplify: true }).transactions;
  }

  const valid = [];
  for (const t of transactions) {
    const from = resolveId(t.from);
    const to = resolveId(t.to);
    const amount = round2(t.amount);
    if (!from || !to || from === to) continue;
    if (!memberIds.has(from) || !memberIds.has(to)) continue;
    if (!Number.isFinite(amount) || amount <= 0) continue;
    valid.push({ from, to, amount });
  }

  if (valid.length === 0) {
    return res.json({
      success: true,
      data: [],
      message: 'All settled up — nothing to record.',
    });
  }

  const created = await Settlement.create(
    valid.map((t) => ({
      trip: trip._id,
      fromUser: t.from,
      toUser: t.to,
      amount: t.amount,
      notes: req.body?.notes || 'Settled in one tap',
    }))
  );

  const populated = await Settlement.find({ _id: { $in: created.map((s) => s._id) } })
    .populate('fromUser', 'name email avatar')
    .populate('toUser', 'name email avatar');

  for (const settlement of populated) {
    await publishTripEvent(trip._id, 'settlement_created', { settlement });
  }

  await notifyTripMembers(trip, req.user._id, {
    type: 'settlement_recorded',
    title: 'Payments recorded',
    body: `${req.user.name} recorded ${populated.length} payment${populated.length === 1 ? '' : 's'}`,
    data: { tripId: trip._id, count: populated.length },
  });

  res.status(201).json({ success: true, data: populated });
};

// @desc    Send a payment reminder (nudge) to a member who owes money
// @route   POST /api/settlements/trip/:tripId/remind
// @access  Private (trip member)
const remindSettlement = async (req, res) => {
  const trip = req.trip;
  const targetId = resolveId(req.body?.toUser);
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!targetId) {
    return res.status(400).json({ message: 'toUser is required' });
  }
  if (!trip.members.some((m) => String(m) === targetId)) {
    return res.status(400).json({ message: 'toUser is not a member of this trip' });
  }
  if (targetId === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot remind yourself' });
  }

  const target = await User.findById(targetId, 'name email avatar');
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }

  let amount = round2(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    const [expenses, settlements] = await Promise.all([
      Expense.find({ trip: trip._id }),
      Settlement.find({ trip: trip._id }),
    ]);
    const { transactions } = computeTripBalances(expenses, settlements, { simplify: true });
    const match = transactions.find(
      (t) => resolveId(t.from) === targetId && resolveId(t.to) === String(req.user._id)
    );
    amount = match ? round2(match.amount) : 0;
  }

  const payload = {
    from: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar || '' },
    to: { _id: target._id, name: target.name, avatar: target.avatar || '' },
    amount,
    message,
    tripId: trip._id,
    sentAt: new Date().toISOString(),
  };

  await publishTripEvent(trip._id, 'settlement_reminder', payload);
  await createNotifications({
    userIds: [targetId],
    trip: trip._id,
    type: 'settlement_reminder',
    title: 'Payment reminder',
    body: message
      || `${req.user.name} reminded you about ${trip.currency} ${amount} in ${trip.name}`,
    data: { tripId: trip._id, amount, from: req.user._id },
  });

  try {
    await sendSettlementReminderEmail({
      to: target.email,
      toName: target.name,
      fromName: req.user.name,
      fromAvatar: req.user.avatar,
      tripName: trip.name,
      currency: trip.currency,
      amount,
      message,
    });
  } catch (err) {
    return res.status(502).json({
      message: `Reminder could not be emailed: ${err.message}`,
    });
  }

  res.json({
    success: true,
    message: `Reminder sent to ${target.name}`,
    data: payload,
  });
};

module.exports = {
  getSettlements,
  createSettlement,
  settleAll,
  remindSettlement,
  deleteSettlement,
};
