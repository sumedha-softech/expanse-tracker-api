const express = require('express');
const router= express.Router();
const {getAllAccount, getAccountById, addNewAccount, updateAccount, deleteAccount, transferAmount, updateTransferAmount} = require('../controllers/account.controller');

//acount related routes here
router.get('/getAllAccount', getAllAccount);
router.get('get/:id',getAccountById )
router.post('/addAccount', addNewAccount);
router.put('/updateAccount',updateAccount);
router.delete('/deleteAccount/:id', deleteAccount);
router.post('/transferAmount', transferAmount);
router.put('/updateTransferAmount', updateTransferAmount)


module.exports = router;