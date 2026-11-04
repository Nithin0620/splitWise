/**
 * Balance Computation — Simplified Debt Algorithm
 *
 * Given a list of expenses and settlements for a trip, computes:
 * 1. Each member's net balance (positive = owed money, negative = owes money)
 * 2. Minimum transactions to settle all debts
 */

/**
 * Compute net balances for all members in a trip.
 * Returns a map: { userId: netAmount }
 * Positive = this user is owed money
 * Negative = this user owes money
 */
const computeNetBalances = (expenses, settlements) => {
  const balances = {};

  // Process expenses
  for (const expense of expenses) {
    const paidById = expense.paidBy._id?.toString() || expense.paidBy.toString();

    // The payer gets credited the full amount
    balances[paidById] = (balances[paidById] || 0) + expense.amount;

    // Each person in the split gets debited their share
    for (const split of expense.splits) {
      const userId = split.user._id?.toString() || split.user.toString();
      balances[userId] = (balances[userId] || 0) - split.amount;
    }
  }

  // Process settlements — fromUser paid toUser, so reduce debts accordingly
  for (const settlement of settlements) {
    const fromId = settlement.fromUser._id?.toString() || settlement.fromUser.toString();
    const toId = settlement.toUser._id?.toString() || settlement.toUser.toString();

    balances[fromId] = (balances[fromId] || 0) + settlement.amount;
    balances[toId] = (balances[toId] || 0) - settlement.amount;
  }

  return balances;
};

/**
 * Simplify debts using a greedy algorithm.
 * Returns an array of { from, to, amount } transactions.
 * This minimizes the number of payments needed.
 */
const simplifyDebts = (balances) => {
  // Separate into creditors (owed money) and debtors (owe money)
  const creditors = []; // { id, amount } — positive balance
  const debtors = [];   // { id, amount } — negative balance (stored as positive)

  for (const [userId, amount] of Object.entries(balances)) {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0.01) creditors.push({ id: userId, amount: rounded });
    else if (rounded < -0.01) debtors.push({ id: userId, amount: -rounded });
  }

  const transactions = [];

  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i];
    const debt = debtors[j];
    const settleAmount = Math.min(credit.amount, debt.amount);

    transactions.push({
      from: debt.id,    // debtor pays
      to: credit.id,    // creditor receives
      amount: Math.round(settleAmount * 100) / 100,
    });

    credit.amount -= settleAmount;
    debt.amount -= settleAmount;

    if (credit.amount < 0.01) i++;
    if (debt.amount < 0.01) j++;
  }

  return transactions;
};

/**
 * Compute direct (un-simplified) pairwise debts between members.
 * Each expense creates an obligation from every split participant to the
 * payer; settlements offset those obligations. Returns the same
 * transaction shape as simplifyDebts: [{ from, to, amount }].
 */
const computePairwiseDebts = (expenses, settlements) => {
  // signed[`${a}|${b}`] = net amount a owes b (negative means b owes a).
  const signed = {};
  const add = (from, to, amount) => {
    const key = `${from}|${to}`;
    signed[key] = (signed[key] || 0) + amount;
  };

  for (const expense of expenses) {
    const paidById = expense.paidBy._id?.toString() || expense.paidBy.toString();
    for (const split of expense.splits) {
      const userId = split.user._id?.toString() || split.user.toString();
      if (userId !== paidById) add(userId, paidById, split.amount);
    }
  }

  for (const settlement of settlements) {
    const fromId = settlement.fromUser._id?.toString() || settlement.fromUser.toString();
    const toId = settlement.toUser._id?.toString() || settlement.toUser.toString();
    add(fromId, toId, -settlement.amount);
  }

  const transactions = [];
  const seen = new Set();
  for (const key of Object.keys(signed)) {
    const [a, b] = key.split('|');
    // Only process each unordered pair once (skip self-pairs).
    if (a === b) continue;
    const pairKey = [a, b].sort().join('|');
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);

    const net = Math.round(((signed[`${a}|${b}`] || 0) - (signed[`${b}|${a}`] || 0)) * 100) / 100;
    if (net > 0.01) transactions.push({ from: a, to: b, amount: net });
    else if (net < -0.01) transactions.push({ from: b, to: a, amount: -net });
  }

  return transactions;
};

/**
 * Full balance summary for a trip.
 * Returns:
 *   - netBalances: { userId: amount }
 *   - transactions: [{ from, to, amount }]
 *   - simplified: whether the transactions were debt-simplified
 */
const computeTripBalances = (expenses, settlements, options = {}) => {
  const { simplify = true } = options;
  const netBalances = computeNetBalances(expenses, settlements);
  const transactions = simplify
    ? simplifyDebts(netBalances)
    : computePairwiseDebts(expenses, settlements);
  return { netBalances, transactions, simplified: simplify };
};

module.exports = {
  computeNetBalances,
  simplifyDebts,
  computePairwiseDebts,
  computeTripBalances,
};
