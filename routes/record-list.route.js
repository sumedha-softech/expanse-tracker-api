
const {fetchAllRecords, createRecord, fetchTransactionRecordById, updateRecordDetails, deleteRecordById} = require('../controllers/record-list.controller');
const express = require('express');
const router =express.Router();


// transaction records routes realated routes here 
router.get('/', fetchAllRecords);
router.post('/', createRecord);
router.get('/:id',  fetchTransactionRecordById )
router.delete('/:id', deleteRecordById);
router.put('/:id', updateRecordDetails);



module.exports = router;