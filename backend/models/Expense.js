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
      enum: ['equal', 'exact', 'percentage'],
      default: 'equal',
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
    throw new Error(`Split amounts (${splitTotal}) must equal total expense amount (${this.amount})`);
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
