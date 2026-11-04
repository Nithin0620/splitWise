const Notification = require('../models/Notification');

// @desc    Get the current user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.readAt = null;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('trip', 'name currency');

  res.json({ success: true, data: notifications });
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    readAt: null,
  });
  res.json({ success: true, data: { count } });
};

// @desc    Mark one notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { readAt: new Date() },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  res.json({ success: true, data: notification });
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, readAt: null },
    { readAt: new Date() }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  res.json({ success: true, message: 'Notification deleted' });
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
};
