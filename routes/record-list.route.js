
const {getAllRecord, addNewRecord, deleteRecord, getRecordById, updateRecord} = require('../controllers/record-list.controller');
const express = require('express');
const router =express.Router();


// transaction records routes realated routes here 
router.get('/getAllRecord', getAllRecord);
router.post('/addNewRecord', addNewRecord);
router.get('/get/:id',getRecordById )
router.delete('/deleteRecord/:id', deleteRecord);
router.put('/updateRecord/:id', updateRecord);



module.exports = router;