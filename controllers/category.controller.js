const Category = require('../model/category.model');
const Account = require('../model/account.model');
const RecordList = require('../model/record-list.model');
const Budget = require('../model/budget.model');
const asyncHandler = require('../utials/asyncHandler');
const createLog = require('../utials/log');
const ApiError = require('../utials/apiError');


//fetch All Categories
const fetchAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({});
    if (categories.length === 0) {
        return res.status(204).send();
    }
    res.status(200).json({ success: true, message: 'All Categories Fatched Successfully', data: categories })

});
//create new Catgeory
const createCategory = asyncHandler(async (req, res) => {
    const { name, type } = req.body;
    if (!name || !type) {
        throw new ApiError(400, 'All Fields are required');
    }
    const newCategoryFormData = { name, type };
    const newCreatedCategory = await Category.create(newCategoryFormData);
    if (newCreatedCategory) {
        await createLog(` ${type}  Category " ${name}"  Created successful`);
        return res.status(201).json({ success: true, message: 'Category Created Successful', data: newCreatedCategory })
    }

    throw new ApiError(400, 'Failed to create Category');


});

//update categoryByid
const updateCategoryDetails = asyncHandler(async (req, res) => {
    const categoryUpdateFormData = req.body;
    const getCurrentCategoryById = req.params.id;
    const updateCategory = await Category.findByIdAndUpdate(getCurrentCategoryById, categoryUpdateFormData, { new: true });
    if (!updateCategory) {
        throw new ApiError(404, 'Category not found');
    }
    await createLog(`"${updateCategory.name} " ${updateCategory.type} Category update successfully`);
    res.status(200).json({ success: true, message: 'Category Update Success', data: updateCategory })
});



//delete Category
const deleteCategoryById = asyncHandler(async (req, res) => {
    const categoryId = req.params.id;
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
        throw new ApiError(404, 'Category not found');
    }
    //monthly budget also deleted when used category deleted
    const deletedBudget = await Budget.findOneAndDelete({ category: categoryId });
    if (deletedBudget) {
        await createLog(`Monthly Set Budget for deleted category "${category.name}" was also Delete`);
    }
    // find all transactions selected category
    const findTransactionRecords = await RecordList.find({ category: categoryId });
    for (const record of findTransactionRecords) {
        const account = await Account.findById(record.account);
        const updateAmount = record.type === 'income' ? -record.amount : record.amount;
        if (account) {
            account.amount += updateAmount;
            await account.save();
        }
        //Log each transaction deletion
        await createLog(`${record.type} transaction of ₹${record.amount} (from deleted category "${category.name}") was removed`)
        await RecordList.findByIdAndDelete(record._id);
    }
    await createLog(`${category.type} category "${category.name}" was deleted`)
    res.status(200).json({ success: true, message: 'Category deleted successfully', data: { category, deletedRecords: findTransactionRecords.length } });
});



//getcategory BY Id 
const fetchCategoryById = asyncHandler(async (req, res) => {
    const getCategoryById = req.params.id;
    const getCategoryDetailsById = await Category.findById(getCategoryById);
    if (!getCategoryDetailsById) {
        throw new ApiError(404, 'Category not found');
    }
    res.status(200).json({ success: true, message: 'Category Details Fetch Success..', data: getCategoryDetailsById })

});

module.exports = { fetchAllCategories, createCategory,fetchCategoryById, deleteCategoryById, updateCategoryDetails }