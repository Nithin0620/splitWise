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
 * Full balance summary for a trip.
 * Returns:
 *   - netBalances: { userId: amount }
 *   - transactions: [{ from, to, amount }]
 */
const computeTripBalances = (expenses, settlements) => {
  const netBalances = computeNetBalances(expenses, settlements);
  const transactions = simplifyDebts(netBalances);
  return { netBalances, transactions };
};

module.exports = { computeNetBalances, simplifyDebts, computeTripBalances };
