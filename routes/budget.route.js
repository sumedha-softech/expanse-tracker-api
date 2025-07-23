const express = require('express');
const router= express.Router();
const {getAllBudget, addNewBudget, updateBudget,deleteBudget}   = require('../controllers/budget.controller');


//budget related routes here
router.post('/addNewBudget', addNewBudget);
router.get('/getAllBudget', getAllBudget);
router.delete('/deleteBudget/:id', deleteBudget);
router.put('/updateBudget/:id', updateBudget)

module.exports = router;