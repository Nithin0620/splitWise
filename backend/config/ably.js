const Ably = require('ably');

let rest;

const getRest = () => {
  if (!process.env.ABLY_API_KEY) return null;
  if (!rest) rest = new Ably.Rest({ key: process.env.ABLY_API_KEY });
  return rest;
};

const publishTripEvent = async (tripId, event, payload) => {
  const client = getRest();
  if (!client) return;
  await client.channels.get(`trip:${tripId}`).publish(event, payload);
};

module.exports = { getRest, publishTripEvent };
