const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const { publishTripEvent } = require('../config/ably');
const { getRate, SUPPORTED_CURRENCIES } = require('../utils/currency');
const { notifyTripMembers } = require('../utils/notifications');
const {
  normalizeRecurrence,
  runDueRecurringExpenses,
} = require('../utils/recurring');

const round2 = (n) => Math.round(Number(n) * 100) / 100;
const resolveId = (value) => String(value?._id ?? value ?? '');

const badRequest = (message) =>
  Object.assign(new Error(message), { statusCode: 400 });

/**
 * Make rounding-safe splits sum exactly to the target amount.
 */
const fixRounding = (splits, target) => {
  const total = splits.reduce((sum, s) => sum + s.amount, 0);
  const diff = round2(target - total);
  if (splits.length && Math.abs(diff) > 0.001) {
    splits[0].amount = round2(splits[0].amount + diff);
  }
  return splits;
};

/**
 * Compute equal-split amounts from total amount and participant list.
 * Handles floating-point rounding by adding the remainder to the first person.
 */
const computeEqualSplits = (amount, memberIds) => {
  if (!memberIds.length) throw badRequest('Select at least one member to split with');
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
  if (!splitsInput?.length) throw badRequest('splits with percentage are required');
  const totalPct = splitsInput.reduce((sum, s) => sum + Number(s.percentage || 0), 0);
  if (Math.abs(totalPct - 100) > 0.01) {
    throw badRequest('Percentages must sum to 100');
  }

  const splits = splitsInput.map((s) => ({
    user: resolveId(s.user),
    amount: Math.round(((amount * Number(s.percentage)) / 100) * 100) / 100,
  }));
  return fixRounding(splits, amount);
};

/**
 * Split by relative shares/units (e.g. 2:1:1) instead of percentages.
 */
const computeSharesSplits = (amount, splitsInput) => {
  if (!splitsInput?.length) throw badRequest('splits with shares are required');
  const shares = splitsInput.map((s) => Math.max(0, Number(s.shares || 0)));
  const totalShares = shares.reduce((sum, n) => sum + n, 0);
  if (totalShares <= 0) throw badRequest('Shares must add up to more than zero');

  const splits = splitsInput.map((s, i) => ({
    user: resolveId(s.user),
    amount: Math.round(((amount * shares[i]) / totalShares) * 100) / 100,
  }));
  return fixRounding(splits, amount);
};

/**
 * Split an itemized bill: each line item is divided among its assigned
 * people, then tax and tip are allocated proportionally to item subtotals.
 */
const computeItemizedSplits = (items, tax, tip) => {
  if (!items?.length) throw badRequest('At least one item is required');

  const subtotalByUser = {};
  let itemSubtotal = 0;

  for (const item of items) {
    const itemAmount = Number(item.amount) || 0;
    const users = (item.users || []).map(resolveId).filter(Boolean);
    if (!users.length) throw badRequest(`Item "${item.name || 'Item'}" needs at least one person`);
    itemSubtotal += itemAmount;
    const share = itemAmount / users.length;
    for (const userId of users) {
      subtotalByUser[userId] = (subtotalByUser[userId] || 0) + share;
    }
  }

  const extras = round2((Number(tax) || 0) + (Number(tip) || 0));
  const entries = Object.entries(subtotalByUser);
  const splits = entries.map(([userId, subtotal]) => {
    const extra = itemSubtotal > 0
      ? (subtotal / itemSubtotal) * extras
      : extras / entries.length;
    return { user: userId, amount: round2(subtotal + extra) };
  });

  const total = round2(itemSubtotal + extras);
  fixRounding(splits, total);
  return { splits, total };
};

/**
 * Build the currency + split fields for create/update from raw input.
 * All splits are stored in the trip currency; `originalAmount` keeps the
 * amount in the expense's own currency for display.
 */
const buildComputedFields = ({ body, trip, existing }) => {
  const splitType = body.splitType || existing?.splitType || 'equal';
  const tripCurrency = String(trip.currency || 'INR').toUpperCase();
  const sourceCurrency = String(
    body.currency || existing?.currency || tripCurrency
  ).toUpperCase();

  if (!SUPPORTED_CURRENCIES.includes(sourceCurrency)) {
    throw badRequest(`Unsupported currency ${sourceCurrency}`);
  }

  const items = (body.items !== undefined ? body.items : existing?.items) || [];
  const tax = body.tax !== undefined ? Number(body.tax) : Number(existing?.tax || 0);
  const tip = body.tip !== undefined ? Number(body.tip) : Number(existing?.tip || 0);

  let originalAmount;
  if (splitType === 'itemized') {
    originalAmount = round2(
      items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) + tax + tip
    );
  } else {
    const rawAmount = body.amount !== undefined
      ? Number(body.amount)
      : Number(existing?.originalAmount ?? existing?.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      throw badRequest('A positive amount is required');
    }
    originalAmount = round2(rawAmount);
  }

  let rate;
  if (sourceCurrency === tripCurrency) {
    rate = 1;
  } else if (body.exchangeRate !== undefined && Number(body.exchangeRate) > 0) {
    rate = Number(body.exchangeRate);
  } else if (
    existing &&
    String(existing.currency || '').toUpperCase() === sourceCurrency &&
    existing.exchangeRate > 0
  ) {
    rate = existing.exchangeRate;
  } else {
    rate = getRate(sourceCurrency, tripCurrency);
  }
  if (!rate || rate <= 0) throw badRequest(`Could not convert ${sourceCurrency} to ${tripCurrency}`);
  rate = Math.round(rate * 10000) / 10000;

  const splitsInput = body.splits !== undefined
    ? body.splits
    : existing?.splits?.map((s) => ({ user: s.user, amount: s.amount }));

  let splits;
  if (splitType === 'equal') {
    const memberIds = splitsInput?.length
      ? splitsInput.map((s) => resolveId(s.user))
      : trip.members.map((m) => String(m));
    splits = computeEqualSplits(originalAmount, memberIds);
  } else if (splitType === 'exact') {
    if (!splitsInput?.length) throw badRequest('splits array is required for exact split');
    splits = splitsInput.map((s) => ({
      user: resolveId(s.user),
      amount: round2(Number(s.amount) || 0),
    }));
    const total = round2(splits.reduce((sum, s) => sum + s.amount, 0));
    if (Math.abs(total - originalAmount) > 0.01) {
      throw badRequest(`Split amounts (${total}) must equal total (${originalAmount})`);
    }
  } else if (splitType === 'percentage') {
    splits = computePercentageSplits(originalAmount, splitsInput);
  } else if (splitType === 'shares') {
    splits = computeSharesSplits(originalAmount, splitsInput);
  } else if (splitType === 'itemized') {
    splits = computeItemizedSplits(items, tax, tip).splits;
  } else {
    throw badRequest('splitType must be equal, exact, percentage, shares, or itemized');
  }

  // Everyone in a split must be a member of the trip.
  const allowedUsers = new Set(trip.members.map((m) => String(m)));
  for (const split of splits) {
    if (!allowedUsers.has(String(split.user))) {
      throw badRequest('All split members must be part of this trip');
    }
  }

  const normalizedItems = splitType === 'itemized'
    ? items.map((item) => ({
        name: String(item.name || 'Item').trim(),
        amount: round2(Number(item.amount) || 0),
        users: (item.users || []).map(resolveId).filter(Boolean),
      }))
    : [];

  const amount = round2(originalAmount * rate);
  const convertedSplits = splits.map((s) => ({
    user: s.user,
    amount: round2(s.amount * rate),
  }));
  fixRounding(convertedSplits, amount);

  return {
    splitType,
    currency: sourceCurrency,
    originalAmount,
    exchangeRate: rate,
    amount,
    splits: convertedSplits,
    items: normalizedItems,
    tax: normalizedItems.length ? round2(tax) : 0,
    tip: normalizedItems.length ? round2(tip) : 0,
  };
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
  const {
    title, category, date, paidBy, splitType, notes, recurrence,
  } = req.body;

  if (!title || !paidBy) {
    return res.status(400).json({ message: 'title and paidBy are required' });
  }

  const trip = req.trip;

  const paidByIsMember = trip.members.some((m) => m.toString() === paidBy.toString());
  if (!paidByIsMember) {
    return res.status(400).json({ message: 'paidBy user is not a member of this trip' });
  }

  const fields = buildComputedFields({ body: req.body, trip });

  const expense = await Expense.create({
    trip: trip._id,
    title,
    amount: fields.amount,
    currency: fields.currency,
    originalAmount: fields.originalAmount,
    exchangeRate: fields.exchangeRate,
    category: category || 'other',
    date: date || Date.now(),
    paidBy,
    splits: fields.splits,
    splitType: fields.splitType,
    items: fields.items,
    tax: fields.tax,
    tip: fields.tip,
    createdBy: req.user._id,
    notes: notes || '',
    recurrence: normalizeRecurrence(recurrence, date || Date.now()),
  });

  await expense.populate('paidBy', 'name email avatar');
  await expense.populate('splits.user', 'name email avatar');
  await expense.populate('createdBy', 'name email avatar');

  await publishTripEvent(trip._id, 'expense_created', { expense });
  await notifyTripMembers(trip, req.user._id, {
    type: 'expense_added',
    title: 'New expense',
    body: `${req.user.name} added "${expense.title}" (${trip.currency} ${expense.amount.toFixed(2)})`,
    data: { tripId: trip._id, expenseId: expense._id },
  });

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

  const isCreator = expense.createdBy.toString() === req.user._id.toString();
  const isPayer = expense.paidBy.toString() === req.user._id.toString();
  if (!isCreator && !isPayer) {
    return res.status(403).json({ message: 'Only the creator or payer can update this expense' });
  }

  const trip = await Trip.findById(expense.trip);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  const {
    title, category, date, paidBy, splitType, notes, recurrence,
  } = req.body;

  const recalcKeys = ['amount', 'currency', 'exchangeRate', 'splitType', 'splits', 'items', 'tax', 'tip'];
  const needsRecalc = recalcKeys.some((key) => req.body[key] !== undefined);

  const updates = {};
  if (needsRecalc) {
    const fields = buildComputedFields({ body: req.body, trip, existing: expense });
    Object.assign(updates, {
      amount: fields.amount,
      currency: fields.currency,
      originalAmount: fields.originalAmount,
      exchangeRate: fields.exchangeRate,
      splitType: fields.splitType,
      splits: fields.splits,
      items: fields.items,
      tax: fields.tax,
      tip: fields.tip,
    });
  }

  if (title !== undefined && String(title).trim()) updates.title = String(title).trim();
  if (category !== undefined) updates.category = category;
  if (date !== undefined) updates.date = date;
  if (paidBy !== undefined) updates.paidBy = paidBy;
  if (notes !== undefined) updates.notes = notes;
  if (recurrence !== undefined) {
    updates.recurrence = normalizeRecurrence(recurrence, updates.date || expense.date);
  }

  const updated = await Expense.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('paidBy', 'name email avatar')
    .populate('splits.user', 'name email avatar')
    .populate('createdBy', 'name email avatar');

  await publishTripEvent(expense.trip, 'expense_updated', { expense: updated });
  await notifyTripMembers(trip, req.user._id, {
    type: 'expense_updated',
    title: 'Expense updated',
    body: `${req.user.name} updated "${updated.title}"`,
    data: { tripId: trip._id, expenseId: updated._id },
  });

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

  const isCreator = expense.createdBy.toString() === req.user._id.toString();
  const isPayer = expense.paidBy.toString() === req.user._id.toString();
  if (!isCreator && !isPayer) {
    return res.status(403).json({ message: 'Only the creator or payer can delete this expense' });
  }

  const tripId = expense.trip;
  const title = expense.title;
  const trip = await Trip.findById(tripId);
  await expense.deleteOne();

  await publishTripEvent(tripId, 'expense_deleted', { expenseId: req.params.id, tripId });
  if (trip) {
    await notifyTripMembers(trip, req.user._id, {
      type: 'expense_deleted',
      title: 'Expense deleted',
      body: `${req.user.name} deleted "${title}"`,
      data: { tripId, expenseId: req.params.id },
    });
  }

  res.json({ success: true, message: 'Expense deleted' });
};

// @desc    Generate any due recurring expenses
// @route   POST /api/expenses/recurring/run
// @access  Private
const runRecurring = async (req, res) => {
  const created = await runDueRecurringExpenses();
  res.json({ success: true, data: { created } });
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  runRecurring,
};
