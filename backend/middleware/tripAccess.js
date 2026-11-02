const Trip = require('../models/Trip');

// Middleware to verify the requesting user is a member of the trip
const isTripMember = async (req, res, next) => {
  const trip = await Trip.findById(req.params.tripId || req.params.id);

  if (!trip) {
    return res.status(404).json({ message: 'Trip not found' });
  }

  const isMember = trip.members.some((m) => m.toString() === req.user._id.toString());
  if (!isMember) {
    return res.status(403).json({ message: 'You are not a member of this trip' });
  }

  req.trip = trip;
  next();
};

// Middleware to verify the requesting user is the trip creator
const isTripOwner = async (req, res, next) => {
  const trip = await Trip.findById(req.params.tripId || req.params.id);

  if (!trip) {
    return res.status(404).json({ message: 'Trip not found' });
  }

  if (trip.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the trip creator can perform this action' });
  }

  req.trip = trip;
  next();
};

module.exports = { isTripMember, isTripOwner };
