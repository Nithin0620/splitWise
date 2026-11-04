const test = require('node:test');
const assert = require('node:assert/strict');

const {
  computeNetBalances,
  simplifyDebts,
  computePairwiseDebts,
  computeTripBalances,
} = require('../utils/balanceCalculator');
const { getRate, convert, SUPPORTED_CURRENCIES } = require('../utils/currency');
const { addInterval, normalizeRecurrence } = require('../utils/recurring');

const id = (n) => ({ toString: () => n });
const user = (n) => ({ _id: id(n) });
const exp = (paidBy, amount, splitUserIds) => ({
  paidBy: user(paidBy),
  amount,
  splits: splitUserIds.map((uid) => ({ user: user(uid), amount: amount / splitUserIds.length })),
});

test('net balances credit payer and debit participants', () => {
  const balances = computeNetBalances(
    [exp('a', 90, ['a', 'b', 'c'])],
    []
  );
  assert.equal(balances.a, 60);
  assert.equal(balances.b, -30);
  assert.equal(balances.c, -30);
});

test('settlements offset outstanding balances', () => {
  const balances = computeNetBalances(
    [exp('a', 90, ['a', 'b', 'c'])],
    [{ fromUser: user('b'), toUser: user('a'), amount: 30 }]
  );
  assert.equal(balances.a, 30);
  assert.equal(balances.b, 0);
  assert.equal(balances.c, -30);
});

test('simplifyDebts settles all balances with minimal transactions', () => {
  const balances = { a: 60, b: -30, c: -30 };
  const txns = simplifyDebts(balances);
  assert.equal(txns.length, 2);
  const total = txns.reduce((sum, t) => sum + t.amount, 0);
  assert.equal(total, 60);
  assert.deepEqual(txns.map((t) => t.to), ['a', 'a']);
});

test('pairwise debts form direct obligations and honour settlements', () => {
  const txns = computePairwiseDebts(
    [exp('a', 90, ['a', 'b', 'c'])],
    [{ fromUser: user('b'), toUser: user('a'), amount: 30 }]
  );
  const bToA = txns.find((t) => t.from === 'b' && t.to === 'a');
  const cToA = txns.find((t) => t.from === 'c' && t.to === 'a');
  assert.equal(bToA, undefined);
  assert.equal(cToA.amount, 30);
});

test('computeTripBalances can return simplified or pairwise results', () => {
  const expenses = [exp('a', 90, ['a', 'b', 'c'])];
  const simplified = computeTripBalances(expenses, [], { simplify: true });
  const pairwise = computeTripBalances(expenses, [], { simplify: false });
  assert.equal(simplified.simplified, true);
  assert.equal(pairwise.simplified, false);
  assert.equal(simplified.transactions.length, 2);
  assert.equal(pairwise.transactions.length, 2);
});

test('currency conversion round-trips through INR rates', () => {
  assert.ok(SUPPORTED_CURRENCIES.includes('INR'));
  assert.equal(getRate('INR'), 1);
  assert.equal(Math.round(convert(100, 'USD', 'INR')), 8300);
  assert.equal(Math.round(convert(8300, 'INR', 'USD')), 100);
  assert.equal(getRate('XYZ', 'INR'), null);
  assert.equal(convert(100, 'INR', 'XYZ'), null);
});

test('recurring intervals advance by the configured period', () => {
  const start = new Date('2026-01-31T00:00:00.000Z');
  assert.equal(addInterval(start, 'daily').toISOString().slice(0, 10), '2026-02-01');
  assert.equal(addInterval(start, 'weekly').toISOString().slice(0, 10), '2026-02-07');
  assert.equal(addInterval(start, 'monthly').toISOString().slice(0, 10), '2026-03-03');
  assert.equal(addInterval(start, 'daily', 3).toISOString().slice(0, 10), '2026-02-03');
});

test('normalizeRecurrence rejects unknown frequencies and computes nextRunAt', () => {
  assert.throws(() => normalizeRecurrence({ frequency: 'yearly' }), /Invalid recurrence/);
  const rec = normalizeRecurrence(
    { frequency: 'weekly', interval: 2 },
    new Date('2026-01-01T00:00:00.000Z')
  );
  assert.equal(rec.interval, 2);
  assert.equal(rec.nextRunAt.toISOString().slice(0, 10), '2026-01-15');
  assert.deepEqual(normalizeRecurrence({ frequency: 'none' }), { frequency: 'none' });
});
