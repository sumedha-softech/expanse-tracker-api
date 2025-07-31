const asyncHandler = require('../utials/asyncHandler');
const Budget = require('../model/budget.model');
const Category = require('../model/category.model');
const createLog = require('../utials/log');
const ApiError = require('../utials/apiError');




//find all budget
const getAllBudget = asyncHandler(async (req, res) => {
    const getBudget = await Budget.find({});
    if (getBudget.length === 0) {
        throw new ApiError(404,'Budget not found');
    }
    res.status(200).json({ success: true, message: 'All Budget Fatch Success', data: getBudget });
});

//set Budget with selected category
const addNewBudget = asyncHandler(async (req, res) => {
    const { categoryId, limit, date } = req.body;
    if (!categoryId || !limit) {
        throw new ApiError(400,'All Fields are required');
    }
    
     const category = await Category.findById(categoryId);
     if(!category) {
        throw new ApiError(404,'Category not found');
     }

    const budget = await Budget.create({
        category: categoryId,
        limit,
        date,
    });
    await createLog(` Created a new monthly Budget for "${category.name}" category with limit ₹${limit}`);
    res.status(201).json({ success: true, message: 'Budget created Successfully.!', data: budget });
});


//Update budget by ID
const updateBudget = asyncHandler(async (req, res) => {
    const budgetUpdateFormData = req.body;
    const getCurrentBudget = req.params.id;
    const { limit } = req.body;
    if (!limit) {
        throw new ApiError(400,'limit is required');
    }
    const updatedBudget = await Budget.findByIdAndUpdate(getCurrentBudget, budgetUpdateFormData, { new: true }
    );
    if (!updatedBudget) {
        throw new ApiError(404,'Budget not found');
    }
    await createLog(`update budget with new limit ${updatedBudget.limit}`)
    res.status(200).json({ success: true, message: 'Budget updated successfully', data: updatedBudget });
});

//deleted budget
const deleteBudget = asyncHandler(async (req, res) => {
    const getBudgetId = req.params.id;
    const deletedBudget = await Budget.findByIdAndDelete(getBudgetId);
    if (!deletedBudget) {
        throw new ApiError(404,'Budget not found');
    }
    await createLog(`deleted a monthly budget of limit ₹${deletedBudget.limit}`)
    res.status(200).json({ success: true, message: 'Category Budget Delete Success', data: deletedBudget });

});

module.exports = { getAllBudget, addNewBudget, updateBudget, deleteBudget };
