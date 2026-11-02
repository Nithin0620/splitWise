const express = require('express');
const { protect } = require('../middleware/auth');
const { isTripMember } = require('../middleware/tripAccess');
const expenseController = require('../controllers/expenseController');

const router = express.Router();

router.use(protect);

// @route   GET  /api/expenses/trip/:tripId  — All expenses for a trip
// @route   POST /api/expenses/trip/:tripId  — Add expense to a trip
router
  .route('/trip/:tripId')
  .get(isTripMember, expenseController.getExpenses)
  .post(isTripMember, expenseController.createExpense);

// @route   GET    /api/expenses/:id  — Get single expense
// @route   PUT    /api/expenses/:id  — Update expense
// @route   DELETE /api/expenses/:id  — Delete expense
router
  .route('/:id')
  .get(expenseController.getExpense)
  .put(expenseController.updateExpense)
  .delete(expenseController.deleteExpense);

module.exports = router;
