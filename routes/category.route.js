const  {getAllCategory, addNewCategory, updateCategory, deleteCategory, getCategoryById} = require('../controllers/category.controller')
const express = require('express');
 const router= express.Router()

//category related routes here
router.get('/getAllCategory', getAllCategory);
router.get('/getcategoryById/:id', getCategoryById)
router.post('/addCategory',addNewCategory);
router.delete('/deleteCategory/:id', deleteCategory);
router.put('/updateCategory/:id',updateCategory );

module.exports = router;