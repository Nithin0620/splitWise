const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Dedupe members and ensure the creator is always in the members list.
// Members may be ObjectIds or populated User docs, so compare via _id.
tripSchema.pre('save', function () {
  const idOf = (ref) => (ref?._id ?? ref).toString();
  const creatorId = idOf(this.createdBy);

  const seen = new Set();
  this.members = this.members.filter((m) => {
    const id = idOf(m);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  if (!seen.has(creatorId)) {
    this.members.push(this.createdBy?._id ?? this.createdBy);
  }
});

tripSchema.index({ members: 1 });
tripSchema.index({ createdBy: 1, updatedAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
