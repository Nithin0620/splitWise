// Keep this table in sync with backend/utils/currency.js.
// Rates are expressed as "INR per 1 unit".
export const RATES_TO_INR = {
  INR: 1,
  USD: 83,
  EUR: 90,
  GBP: 105,
  AUD: 55,
  CAD: 61,
  SGD: 62,
  JPY: 0.55,
  AED: 22.6,
}

export const CURRENCIES = Object.keys(RATES_TO_INR)

export const getRate = (from, to) => {
  const f = RATES_TO_INR[String(from || 'INR').toUpperCase()]
  const t = RATES_TO_INR[String(to || 'INR').toUpperCase()]
  if (!f || !t) return null
  return f / t
}

export const convert = (amount, from, to) => {
  const rate = getRate(from, to)
  if (rate === null) return null
  return Math.round(Number(amount) * rate * 100) / 100
}

export const round2 = (n) => Math.round(Number(n) * 100) / 100
