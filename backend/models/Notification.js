const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    type: {
      type: String,
      enum: [
        'expense_added',
        'expense_updated',
        'expense_deleted',
        'settlement_recorded',
        'settlement_reminder',
        'settlement_deleted',
        'member_added',
        'member_removed',
        'trip_updated',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
