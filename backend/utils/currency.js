// Approximate conversion rates expressed as "INR per 1 unit".
// These are static fallbacks so the app works without a live FX provider.
// Swap `getRate` for a provider (e.g. exchangerate.host) when available.
const RATES_TO_INR = {
  INR: 1,
  USD: 83,
  EUR: 90,
  GBP: 105,
  AUD: 55,
  CAD: 61,
  SGD: 62,
  JPY: 0.55,
  AED: 22.6,
};

const SUPPORTED_CURRENCIES = Object.keys(RATES_TO_INR);

const normalize = (code) => String(code || 'INR').toUpperCase();

const getRate = (from, to) => {
  const f = RATES_TO_INR[normalize(from)];
  const t = RATES_TO_INR[normalize(to)];
  if (!f || !t) return null;
  return f / t;
};

const convert = (amount, from, to) => {
  const rate = getRate(from, to);
  if (rate === null) return null;
  return Math.round(Number(amount) * rate * 100) / 100;
};

module.exports = {
  RATES_TO_INR,
  SUPPORTED_CURRENCIES,
  getRate,
  convert,
};
