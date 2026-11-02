const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const { getIO } = require('../config/socket');

/**
 * Compute equal-split amounts from total amount and participant list.
 * Handles floating-point rounding by adding the remainder to the first person.
 */
const computeEqualSplits = (amount, memberIds) => {
  const share = Math.floor((amount / memberIds.length) * 100) / 100;
  const remainder = Math.round((amount - share * memberIds.length) * 100) / 100;

  return memberIds.map((userId, idx) => ({
    user: userId,
    amount: idx === 0 ? Math.round((share + remainder) * 100) / 100 : share,
  }));
};

/**
 * Validate percentage splits — they must sum to 100 and produce correct amounts.
 */
const computePercentageSplits = (amount, splitsInput) => {
  const totalPct = splitsInput.reduce((sum, s) => sum + s.percentage, 0);
  if (Math.abs(totalPct - 100) > 0.01) {
    throw Object.assign(new Error('Percentages must sum to 100'), { statusCode: 400 });
  }

  return splitsInput.map((s) => ({
    user: s.user,
    amount: Math.round((amount * s.percentage) / 100 * 100) / 100,
  }));
};

// @desc    Get all expenses for a trip
// @route   GET /api/expenses/trip/:tripId
// @access  Private (trip member)
const getExpenses = async (req, res) => {
  const expenses = await Expense.find({ trip: req.params.tripId })
    .populate('paidBy', 'name email avatar')
    .populate('splits.user', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .sort({ date: -1 });

  res.json({ success: true, data: expenses });
};

// @desc    Get a single expense by id
// @route   GET /api/expenses/:id
// @access  Private (trip member — verified inline)
const getExpense = async (req, res) => {
  const expense = await Expense.findById(req.params.id)
    .populate('paidBy', 'name email avatar')
    .populate('splits.user', 'name email avatar')
    .populate('createdBy', 'name email avatar');

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  // Ensure the requesting user is a member of the expense's trip
  const trip = await Trip.findById(expense.trip);
  const isMember = trip?.members.some((m) => m.toString() === req.user._id.toString());
  if (!isMember) {
    return res.status(403).json({ message: 'You are not a member of this trip' });
  }

  res.json({ success: true, data: expense });
};

// @desc    Create a new expense in a trip
// @route   POST /api/expenses/trip/:tripId
// @access  Private (trip member)
const createExpense = async (req, res) => {
  const { title, amount, category, date, paidBy, splitType, splits, notes } = req.body;

  if (!title || !amount || !paidBy) {
    return res.status(400).json({ message: 'title, amount, and paidBy are required' });
  }

  const trip = req.trip; // attached by isTripMember middleware

  // Verify paidBy is a trip member
  const paidByIsMember = trip.members.some((m) => m.toString() === paidBy.toString());
  if (!paidByIsMember) {
    return res.status(400).json({ message: 'paidBy user is not a member of this trip' });
  }

  let computedSplits;

  if (!splitType || splitType === 'equal') {
    // Default: split equally among all trip members
    const memberIds = splits?.length
      ? splits.map((s) => s.user)
      : trip.members.map((m) => m.toString());

    computedSplits = computeEqualSplits(amount, memberIds);
  } else if (splitType === 'exact') {
    if (!splits || splits.length === 0) {
      return res.status(400).json({ message: 'splits array is required for exact split type' });
    }
    computedSplits = splits.map((s) => ({ user: s.user, amount: s.amount }));
  } else if (splitType === 'percentage') {
    if (!splits || splits.length === 0) {
      return res.status(400).json({ message: 'splits array with percentage is required for percentage split type' });
    }
    computedSplits = computePercentageSplits(amount, splits);
  } else {
    return res.status(400).json({ message: 'splitType must be equal, exact, or percentage' });
  }

  const expense = await Expense.create({
    trip: trip._id,
    title,
    amount,
    category: category || 'other',
    date: date || Date.now(),
    paidBy,
    splits: computedSplits,
    splitType: splitType || 'equal',
    createdBy: req.user._id,
    notes: notes || '',
  });

  await expense.populate('paidBy', 'name email avatar');
  await expense.populate('splits.user', 'name email avatar');
  await expense.populate('createdBy', 'name email avatar');

  // Notify trip room of new expense
  getIO().to(`trip:${trip._id}`).emit('expense_created', { expense });

  res.status(201).json({ success: true, data: expense });
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private (trip member who created or paid for it)
const updateExpense = async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  // Only the creator or the payer can update
  const isCreator = expense.createdBy.toString() === req.user._id.toString();
  const isPayer = expense.paidBy.toString() === req.user._id.toString();
  if (!isCreator && !isPayer) {
    return res.status(403).json({ message: 'Only the creator or payer can update this expense' });
  }

  const { title, amount, category, date, paidBy, splitType, splits, notes } = req.body;

  const newAmount = amount !== undefined ? amount : expense.amount;
  const newSplitType = splitType || expense.splitType;

  let computedSplits = expense.splits;

  if (amount !== undefined || splitType !== undefined || splits !== undefined) {
    const trip = await Trip.findById(expense.trip);

    if (!newSplitType || newSplitType === 'equal') {
      const memberIds = splits?.length
        ? splits.map((s) => s.user)
        : trip.members.map((m) => m.toString());
      computedSplits = computeEqualSplits(newAmount, memberIds);
    } else if (newSplitType === 'exact') {
      if (!splits || splits.length === 0) {
        return res.status(400).json({ message: 'splits array is required for exact split type' });
      }
      computedSplits = splits.map((s) => ({ user: s.user, amount: s.amount }));
    } else if (newSplitType === 'percentage') {
      if (!splits || splits.length === 0) {
        return res.status(400).json({ message: 'splits array with percentage is required for percentage split type' });
      }
      computedSplits = computePercentageSplits(newAmount, splits);
    }
  }

  const updated = await Expense.findByIdAndUpdate(
    req.params.id,
    {
      ...(title && { title }),
      ...(amount !== undefined && { amount }),
      ...(category && { category }),
      ...(date && { date }),
      ...(paidBy && { paidBy }),
      splitType: newSplitType,
      splits: computedSplits,
      ...(notes !== undefined && { notes }),
    },
    { new: true, runValidators: true }
  )
    .populate('paidBy', 'name email avatar')
    .populate('splits.user', 'name email avatar')
    .populate('createdBy', 'name email avatar');

  // Notify the trip room
  getIO().to(`trip:${expense.trip}`).emit('expense_updated', { expense: updated });

  res.json({ success: true, data: updated });
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (trip member who created or paid for it)
const deleteExpense = async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  // Only the creator or the payer can delete
  const isCreator = expense.createdBy.toString() === req.user._id.toString();
  const isPayer = expense.paidBy.toString() === req.user._id.toString();
  if (!isCreator && !isPayer) {
    return res.status(403).json({ message: 'Only the creator or payer can delete this expense' });
  }

  const tripId = expense.trip;
  await expense.deleteOne();

  // Notify the trip room
  getIO().to(`trip:${tripId}`).emit('expense_deleted', { expenseId: req.params.id, tripId });

  res.json({ success: true, message: 'Expense deleted' });
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
};
