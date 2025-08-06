const  {fetchAllCategories, fetchCategoryById, createCategory, deleteCategoryById, updateCategoryDetails} = require('../controllers/category.controller')
const express = require('express');
 const router= express.Router()

//category related routes here
router.get('/', fetchAllCategories);
router.get('/:id',  fetchCategoryById)
router.post('/', createCategory);
router.delete('/:id', deleteCategoryById);
router.put('/:id', updateCategoryDetails );

module.exports = router;