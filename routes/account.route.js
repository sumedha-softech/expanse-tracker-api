const express = require('express');
const router= express.Router();
const {fetchAllAccounts, fetchAccountById, createAccount, removeAccountById, updateAccountDetails, transferAmountBetweenAccounts, updateTransferTransaction} = require('../controllers/account.controller');

//acount related routes here
router.get('/', fetchAllAccounts);
router.get('/:id',fetchAccountById )
router.post('/', createAccount);
router.put('/:id',updateAccountDetails);
router.delete('/:id', removeAccountById);
router.post('/transfer', transferAmountBetweenAccounts);
router.put('/transfer/:id', updateTransferTransaction)


module.exports = router;