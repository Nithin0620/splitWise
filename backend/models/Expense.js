const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Exact amount this user owes for this expense
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'other'],
      default: 'other',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // Who paid for this expense
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // How the expense is split among members
    splits: [splitSchema],
    // How the split was calculated
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage', 'shares', 'itemized'],
      default: 'equal',
    },
    // Original amount in the expense's own currency (for foreign-currency
    // expenses). `amount` always stays in the trip currency so balances and
    // settlements remain simple.
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: '',
    },
    originalAmount: {
      type: Number,
      min: 0,
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },
    // Itemized bill lines. Each item is split equally among its `users`, and
    // tax/tip are allocated proportionally to each person's item subtotal.
    items: [
      {
        _id: false,
        name: { type: String, trim: true, default: 'Item' },
        amount: { type: Number, min: 0, default: 0 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    tax: { type: Number, min: 0, default: 0 },
    tip: { type: Number, min: 0, default: 0 },
    // Recurring schedule. The expense itself is the first occurrence; the
    // scheduler clones it forward and advances nextRunAt.
    recurrence: {
      frequency: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none',
      },
      interval: { type: Number, min: 1, default: 1 },
      nextRunAt: { type: Date },
      endDate: { type: Date },
    },
    recurrenceParent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Validate that splits sum equals total amount (allow small float tolerance)
expenseSchema.pre('save', function () {
  const splitTotal = this.splits.reduce((sum, s) => sum + s.amount, 0);
  if (Math.abs(splitTotal - this.amount) > 0.01) {
    throw Object.assign(
      new Error(`Split amounts (${splitTotal}) must equal total expense amount (${this.amount})`),
      { statusCode: 400 }
    );
  }
});

expenseSchema.index({ trip: 1, date: -1 });
expenseSchema.index({ recurrenceParent: 1 });
expenseSchema.index({ 'recurrence.nextRunAt': 1 }, { sparse: true });

module.exports = mongoose.model('Expense', expenseSchema);
