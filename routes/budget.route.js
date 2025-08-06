const express = require('express');
const router= express.Router();
const {fetchAllBudgets,createBudget, deleteBudgetById, updateBudgetDetails }   = require('../controllers/budget.controller');


//budget related routes here
router.get('/', fetchAllBudgets);
router.post('/', createBudget);
router.delete('/:id',deleteBudgetById);
router.put('/:id', updateBudgetDetails)

module.exports = router;