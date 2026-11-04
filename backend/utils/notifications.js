const Notification = require('../models/Notification');
const { publishUserEvent } = require('../config/ably');

/**
 * Create one notification per user and publish it to their personal realtime
 * channel. Never throws — notifications must not break the main action.
 */
const createNotifications = async ({ userIds, trip, type, title, body, data }) => {
  const unique = [...new Set((userIds || []).map((id) => String(id)).filter(Boolean))];
  if (unique.length === 0) return [];

  try {
    const docs = await Notification.insertMany(
      unique.map((userId) => ({
        user: userId,
        trip: trip || null,
        type,
        title,
        body: body || '',
        data: data || {},
      }))
    );

    await Promise.all(
      docs.map((doc) =>
        publishUserEvent(doc.user, 'notification_created', {
          notification: doc,
        }).catch(() => {})
      )
    );

    return docs;
  } catch (err) {
    console.error('Failed to create notifications:', err.message);
    return [];
  }
};

/**
 * Notify every trip member except the actor.
 */
const notifyTripMembers = (trip, actorId, payload) => {
  const userIds = (trip.members || []).filter(
    (memberId) => String(memberId) !== String(actorId)
  );
  return createNotifications({ userIds, trip: trip._id, ...payload });
};

module.exports = { createNotifications, notifyTripMembers };
