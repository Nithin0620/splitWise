const Expense = require('../models/Expense');
const { publishTripEvent } = require('../config/ably');
const connectDB = require('../config/db');

const addInterval = (date, frequency, interval = 1) => {
  const d = new Date(date);
  const n = Math.max(1, Number(interval) || 1);
  if (frequency === 'daily') d.setDate(d.getDate() + n);
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7 * n);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + n);
  return d;
};

/**
 * Normalize a user-supplied recurrence object. Returns a recurrence sub-doc
 * with `nextRunAt` computed from the expense date.
 */
const normalizeRecurrence = (recurrence, date) => {
  if (!recurrence || !recurrence.frequency || recurrence.frequency === 'none') {
    return { frequency: 'none' };
  }
  const frequency = recurrence.frequency;
  if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
    throw Object.assign(new Error('Invalid recurrence frequency'), { statusCode: 400 });
  }
  const interval = Math.max(1, Number(recurrence.interval) || 1);
  const start = date ? new Date(date) : new Date();
  return {
    frequency,
    interval,
    nextRunAt: addInterval(start, frequency, interval),
    endDate: recurrence.endDate ? new Date(recurrence.endDate) : undefined,
  };
};

/**
 * Generate any recurring expenses that are due. Returns the number created.
 * Safe to call from a cron, a scheduler, or an HTTP endpoint.
 */
const runDueRecurringExpenses = async (now = new Date()) => {
  await connectDB();

  const due = await Expense.find({
    'recurrence.frequency': { $ne: 'none' },
    'recurrence.nextRunAt': { $lte: now },
  });

  let createdCount = 0;

  for (const template of due) {
    const { frequency, interval, nextRunAt, endDate } = template.recurrence;

    // Series has ended.
    if (endDate && nextRunAt > endDate) {
      template.recurrence.frequency = 'none';
      await template.save();
      continue;
    }

    const child = await Expense.create({
      trip: template.trip,
      title: template.title,
      amount: template.amount,
      currency: template.currency,
      originalAmount: template.originalAmount,
      exchangeRate: template.exchangeRate,
      category: template.category,
      date: nextRunAt,
      paidBy: template.paidBy,
      splits: template.splits.map((s) => ({ user: s.user, amount: s.amount })),
      splitType: template.splitType,
      items: template.items,
      tax: template.tax,
      tip: template.tip,
      createdBy: template.createdBy,
      notes: template.notes,
      recurrence: { frequency: 'none' },
      recurrenceParent: template._id,
    });

    await child.populate('paidBy', 'name email avatar');
    await child.populate('splits.user', 'name email avatar');
    await child.populate('createdBy', 'name email avatar');
    await publishTripEvent(template.trip, 'expense_created', { expense: child });

    const next = addInterval(nextRunAt, frequency, interval);
    if (endDate && next > endDate) {
      template.recurrence.frequency = 'none';
    } else {
      template.recurrence.nextRunAt = next;
    }
    await template.save();
    createdCount += 1;
  }

  return createdCount;
};

let timer = null;

/**
 * Start a lightweight in-process scheduler. Only used on long-running
 * Node deployments (not on Cloudflare Workers, which are request-scoped).
 */
const startRecurringScheduler = (intervalMs = 60 * 60 * 1000) => {
  if (timer) return timer;
  timer = setInterval(() => {
    runDueRecurringExpenses().catch((err) => {
      console.error('Recurring expense run failed:', err.message);
    });
  }, intervalMs);
  if (timer.unref) timer.unref();
  return timer;
};

const stopRecurringScheduler = () => {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
};

module.exports = {
  addInterval,
  normalizeRecurrence,
  runDueRecurringExpenses,
  startRecurringScheduler,
  stopRecurringScheduler,
};
