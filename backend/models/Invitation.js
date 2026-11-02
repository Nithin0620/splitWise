const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    // Who sent the invite
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Email address the invite was sent to
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Secure random token embedded in the invite link
    token: {
      type: String,
      required: true,
      unique: true,
    },
    // When the invite link expires (48 hours from creation)
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'cancelled', 'expired'],
      default: 'pending',
    },
    // Populated once the invite is accepted
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate a 32-byte hex token before saving if not set
invitationSchema.pre('validate', function () {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
  }
});

// Convenience method to check if a token is still valid
invitationSchema.methods.isValid = function () {
  return this.status === 'pending' && this.expiresAt > new Date();
};

// Compound index: one active invite per (trip + email)
invitationSchema.index({ trip: 1, email: 1 });
// TTL index to auto-delete expired invitations after 7 days
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('Invitation', invitationSchema);
