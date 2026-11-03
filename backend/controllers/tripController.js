const Trip = require('../models/Trip');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Invitation = require('../models/Invitation');
const { computeTripBalances } = require('../utils/balanceCalculator');
const { publishTripEvent } = require('../config/ably');
const { sendInviteEmail } = require('../utils/email');

// @desc  Get all trips for current user
const getTrips = async (req, res) => {
  const trips = await Trip.find({ members: req.user._id })
    .populate('createdBy', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: trips });
};

// @desc  Get single trip
const getTrip = async (req, res) => {
  // req.trip is attached by isTripMember middleware
  const trip = await Trip.findById(req.trip._id)
    .populate('createdBy', 'name email avatar')
    .populate('members', 'name email avatar');

  res.json({ success: true, data: trip });
};

// @desc  Create a trip
const createTrip = async (req, res) => {
  const { name, description, startDate, endDate, currency } = req.body;

  const trip = await Trip.create({
    name,
    description,
    startDate,
    endDate,
    currency,
    createdBy: req.user._id,
    members: [req.user._id],
  });

  await trip.populate('createdBy', 'name email avatar');
  await trip.populate('members', 'name email avatar');

  res.status(201).json({ success: true, data: trip });
};

// @desc  Update trip details
const updateTrip = async (req, res) => {
  const { name, description, startDate, endDate, currency, isArchived } = req.body;

  const trip = await Trip.findByIdAndUpdate(
    req.trip._id,
    { name, description, startDate, endDate, currency, isArchived },
    { new: true, runValidators: true }
  )
    .populate('createdBy', 'name email avatar')
    .populate('members', 'name email avatar');

  // Notify all members of the update
  await publishTripEvent(trip._id, 'trip_updated', { trip });

  res.json({ success: true, data: trip });
};

// @desc  Delete trip (and all related expenses/settlements)
const deleteTrip = async (req, res) => {
  const tripId = req.trip._id;

  await Promise.all([
    Trip.findByIdAndDelete(tripId),
    Expense.deleteMany({ trip: tripId }),
    Settlement.deleteMany({ trip: tripId }),
  ]);

  await publishTripEvent(tripId, 'trip_deleted', { tripId });

  res.json({ success: true, message: 'Trip deleted' });
};

// @desc  Add a member to a trip by email
const addMember = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const trip = req.trip;

  // ── Case 1: User already registered ──────────────────────────────────────
  const userToAdd = await User.findOne({ email: normalizedEmail });

  if (userToAdd) {
    const alreadyMember = trip.members.some((m) => m.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this trip' });
    }

    trip.members.push(userToAdd._id);
    await trip.save();

    await trip.populate('members', 'name email avatar');
    await trip.populate('createdBy', 'name email avatar');

    await publishTripEvent(trip._id, 'member_added', { trip, newMember: userToAdd });

    return res.json({ success: true, data: trip });
  }

  // ── Case 2: User not registered — send invite email ───────────────────────

  // Check if already a pending invite for this email+trip
  const existingInvite = await Invitation.findOne({
    trip: trip._id,
    email: normalizedEmail,
    status: 'pending',
  });

  if (existingInvite && existingInvite.expiresAt > new Date()) {
    return res.status(400).json({
      message: `An active invitation has already been sent to ${normalizedEmail}. It expires at ${existingInvite.expiresAt.toISOString()}.`,
    });
  }

  // Cancel any stale invites before creating a fresh one
  await Invitation.updateMany(
    { trip: trip._id, email: normalizedEmail, status: 'pending' },
    { status: 'cancelled' }
  );

  const invitation = await Invitation.create({
    trip: trip._id,
    invitedBy: req.user._id,
    email: normalizedEmail,
  });

  const baseUrl = process.env.INVITE_BASE_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const inviteUrl = `${baseUrl}/invite/accept?token=${invitation.token}`;

  await trip.populate('members', 'name email avatar');
  await trip.populate('createdBy', 'name email avatar');

  try {
    await sendInviteEmail({
      to: normalizedEmail,
      inviterName: req.user.name,
      inviterAvatar: req.user.avatar || null,
      tripName: trip.name,
      currency: trip.currency,
      memberCount: trip.members.length,
      inviteUrl,
    });
  } catch (emailErr) {
    await Invitation.findByIdAndDelete(invitation._id);
    console.error('Invite email send error:', emailErr.message);
    return res.status(502).json({
      message: `Could not send invite email to ${normalizedEmail}: ${emailErr.message}`,
    });
  }

  return res.status(202).json({
    success: true,
    invited: true,
    message: `${normalizedEmail} is not on SplitWise yet — an invitation email has been sent.`,
    data: {
      inviteId: invitation._id,
      email: normalizedEmail,
      expiresAt: invitation.expiresAt,
    },
  });
};

// @desc  Remove a member from a trip
const removeMember = async (req, res) => {
  const { userId } = req.params;
  const trip = req.trip;

  // Can't remove the creator
  if (trip.createdBy.toString() === userId) {
    return res.status(400).json({ message: 'Cannot remove the trip creator' });
  }

  trip.members = trip.members.filter((m) => m.toString() !== userId);
  await trip.save();

  await trip.populate('members', 'name email avatar');
  await trip.populate('createdBy', 'name email avatar');

  await publishTripEvent(trip._id, 'member_removed', { trip, removedUserId: userId });

  res.json({ success: true, data: trip });
};

// @desc  Get balance summary for a trip
const getTripBalances = async (req, res) => {
  const tripId = req.trip._id;

  const [expenses, settlements] = await Promise.all([
    Expense.find({ trip: tripId }).populate('paidBy', 'name email avatar').populate('splits.user', 'name email avatar'),
    Settlement.find({ trip: tripId }).populate('fromUser', 'name email avatar').populate('toUser', 'name email avatar'),
  ]);

  const { netBalances, transactions } = computeTripBalances(expenses, settlements);

  // Enrich netBalances with user info (include past members still present in
  // expenses/settlements so their names resolve).
  const memberIds = [...new Set([...req.trip.members.map(String), ...Object.keys(netBalances)])];
  const members = await User.find({ _id: { $in: memberIds } }, 'name email avatar');
  const memberMap = {};
  members.forEach((m) => (memberMap[m._id.toString()] = m));

  const balanceSummary = Object.entries(netBalances).map(([userId, amount]) => ({
    user: memberMap[userId] || { _id: userId },
    netAmount: Math.round(amount * 100) / 100,
  }));

  // Enrich transactions with user info
  const enrichedTransactions = transactions.map((t) => ({
    from: memberMap[t.from] || { _id: t.from },
    to: memberMap[t.to] || { _id: t.to },
    amount: t.amount,
  }));

  // Per-member spending. Each member's own share of expenses is only counted
  // once it is settled — i.e. covered by what they paid plus what they have
  // settled with others (net of settlements received).
  const currentMemberIds = req.trip.members.map(String);
  const spending = {};
  currentMemberIds.forEach((id) => {
    spending[id] = { ownShare: 0, paid: 0, settledOut: 0, settledIn: 0 };
  });

  for (const expense of expenses) {
    const paidById = expense.paidBy._id?.toString() || expense.paidBy.toString();
    if (spending[paidById]) spending[paidById].paid += expense.amount;

    for (const split of expense.splits) {
      const userId = split.user._id?.toString() || split.user.toString();
      if (spending[userId]) spending[userId].ownShare += split.amount;
    }
  }

  for (const settlement of settlements) {
    const fromId = settlement.fromUser._id?.toString() || settlement.fromUser.toString();
    const toId = settlement.toUser._id?.toString() || settlement.toUser.toString();
    if (spending[fromId]) spending[fromId].settledOut += settlement.amount;
    if (spending[toId]) spending[toId].settledIn += settlement.amount;
  }

  const memberSpending = currentMemberIds.map((id) => {
    const { ownShare, paid, settledOut, settledIn } = spending[id];
    const settledShare = Math.min(ownShare, Math.max(0, paid + settledOut - settledIn));
    return {
      user: memberMap[id] || { _id: id },
      totalSpent: Math.round(settledShare * 100) / 100,
      totalShare: Math.round(ownShare * 100) / 100,
      isFullySettled: settledShare >= ownShare - 0.01,
    };
  });

  res.json({
    success: true,
    data: {
      balances: balanceSummary,
      transactions: enrichedTransactions,
      spending: memberSpending,
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      totalSettled: settlements.reduce((sum, s) => sum + s.amount, 0),
    },
  });
};

module.exports = {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  addMember,
  removeMember,
  getTripBalances,
};
