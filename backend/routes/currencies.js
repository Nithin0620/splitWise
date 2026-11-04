const express = require('express');
const { protect } = require('../middleware/auth');
const {
  RATES_TO_INR,
  SUPPORTED_CURRENCIES,
  getRate,
  convert,
} = require('../utils/currency');

const router = express.Router();

router.use(protect);

// @route   GET /api/currencies
// @desc    Supported currencies and INR-based rates
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: { base: 'INR', rates: RATES_TO_INR, currencies: SUPPORTED_CURRENCIES },
  });
});

// @route   GET /api/currencies/convert?amount=100&from=USD&to=INR
router.get('/convert', (req, res) => {
  const amount = Number(req.query.amount);
  const from = req.query.from || 'INR';
  const to = req.query.to || 'INR';
  if (!Number.isFinite(amount)) {
    return res.status(400).json({ message: 'A numeric amount is required' });
  }
  const rate = getRate(from, to);
  if (rate === null) {
    return res.status(400).json({ message: `Unsupported currency pair ${from}/${to}` });
  }
  res.json({
    success: true,
    data: { amount, from, to, rate, result: convert(amount, from, to) },
  });
});

module.exports = router;
