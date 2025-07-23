const Budget = require('../model/budget.model');
const User = require('../model/user.model');
const Log = require('../model/log.model');
const Category = require('../model/category.model');



//find all budget
const getAllBudget = async (req, res) => {
    try {
        const Budgets = await Budget.find({});
        if (Budgets.length > 0) {
            return res.status(200).json({ success: true, message: 'All Budget Fatch Success', data: Budgets })
        }
        else {
            return res.status(404).json({ success: false, message: 'Budget Not Found' })
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Somethng went wrong!please try again' })
    }
}


//set Budget with selected category
const addNewBudget = async (req, res) => {
    try {
        const { categoryId, limit, date } = req.body;
        const user = await User.findOne({});
        if (!categoryId || !limit) {
            return res.status(400).json({ success: false, message: 'All Fields are required' });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: 'user not found' })
        }
        // Check if budget already exists for this category
        const existCategoryBudget = await Budget.findOne({ category: categoryId, date });
        if (existCategoryBudget) {
            existCategoryBudget.limit = limit;
            await existCategoryBudget.save();
            return res.status(200).json({ success: true, message: 'Budget updated', data: existCategoryBudget });
        }
        const budget = await Budget.create({
            category: categoryId,
            limit,
            date,
            userId: user._id
        });

        await Log.create({ userId: user._id, message: `${user.username} created a new monthly budget limit ₹${limit}` });
        return res.status(201).json({ success: true, message: 'Budget created Successfully.!', data: budget });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Something went wrong! Please try again' });
    }
};



//Update budget by ID
const updateBudget = async (req, res) => {
    try {
        const budgetUpdateFormData = req.body;
        const getCurrentBudget = req.params.id;
        const { limit } = req.body;
        if (!limit) {
            return res.status(400).json({ success: false, message: 'Limit is required' });
        }
        const updatedBudget = await Budget.findByIdAndUpdate(getCurrentBudget, budgetUpdateFormData, { new: true }
        );
        if (!updatedBudget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }
        return res.status(200).json({ success: true, message: 'Budget updated successfully', data: updatedBudget });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};


//delete
const deleteBudget = async (req, res) => {
    try {
        const getCurrentBudgetId = req.params.id;
        const deleteBudget = await Budget.findByIdAndDelete(getCurrentBudgetId);
        if (!deleteBudget) {
            return res.status(404).json({ success: false, message: 'Selected ctageory budget not found' })
        }
        res.status(200).json({ success: true, message: 'Category Budget Delete Success', data: deleteBudget })
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'something went wrong! please try again' })

    }
}

module.exports = { getAllBudget, addNewBudget, updateBudget, deleteBudget };
