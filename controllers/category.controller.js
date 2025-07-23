const Category = require('../model/category.model');
const Account = require('../model/account.model');
const RecordList = require('../model/record-list.model');
const User = require('../model/user.model');
const Log = require('../model/log.model');
const Budget = require('../model/budget.model');


//getAll Category
const getAllCategory = async (req, res) => {
    try {
        const getAllCategory = await Category.find({});
        if (getAllCategory.length > 0) {
            return res.status(200).json({ success: true, message: 'All Category Fatch Successfully', data: getAllCategory })
        }
        else {
            return res.status(404).json({ success: false, message: 'Category Not Found' })
        }
    }
    catch (error) {
        console.log(err);
        return res.state(500).json({ success: false, message: 'Something went wrong! please try again' })
    }
}
//create new Catgeory
const addNewCategory = async (req, res) => {
    try {
        const { name, type } = req.body;
        if (!name || !type) {
            return res.status(404).json({ success: false, message: 'All Fields are required' })
        }
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const newCategoryFormData = { name, type };
        const newCreatedCategory = await Category.create(newCategoryFormData);
        if (newCreatedCategory) {
            const message = ` ${type}  Category " ${name}"  Created successful By: "${user.username}"`
            await Log.create({ userId: user._id, message });
            return res.status(201).json({ success: true, message: 'Category Cretae Successful', data: newCreatedCategory })
        }
        else {
            return res.status(400).json({ success: false, message: 'Failed to create Category' })
        }
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Something went wrong! please try again'
        })
    }
}
//delete Category
const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findByIdAndDelete(categoryId);
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        //monthly budget also deleted when used category deleted
        const deletedBudget = await Budget.findOneAndDelete({ category: categoryId });
        if (deletedBudget) {
            await Log.create({
                userId: user._id,
                message: `Monthly Set Budget for deleted category "${category.name}" was also Delete by ${user.username}`,
            });
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
            const message = `${record.type} transaction of ₹${record.amount} (from deleted category "${category.name}") was removed by ${user.username}`;
            await Log.create({ userId: user._id, message });
            await RecordList.findByIdAndDelete(record._id);
        }
        await Log.create({ userId: user._id, message: `${category.type} category "${category.name}" was deleted by ${user.username}` });
        return res.status(200).json({ success: true, message: 'Category deleted successfully', data: { category, deletedRecords: findTransactionRecords.length } });
    }
    catch (error) {
        console.error('Error deleting category:', error.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
};


//update categoryByid
const updateCategory = async (req, res) => {
    try {
        const categoryUpdateFormData = req.body;
        const getCurrentCategoryById = req.params.id;
        const updateCategory = await Category.findByIdAndUpdate(getCurrentCategoryById, categoryUpdateFormData, { new: true });
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!updateCategory) {
            return res.status(404).json({ success: false, message: 'Category Not Found' })
        }
        const message = `"${updateCategory.name} "  ${updateCategory.type} Category update successfully. By: "${user.username}"`;
        await Log.create({ userId: user._id, message });
        return res.status(200).json({ success: true, message: 'Category Update Success', data: updateCategory })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'something went wrong! please try again' })
    }
}

//getcategory BY Id 
const getCategoryById = async (req, res) => {
    try {
        const getCurrentCategoryById = req.params.id;
        const getCategoryDetailsById = await Category.findById(getCurrentCategoryById);
        if (!getCategoryDetailsById) {
            return res.status(404).json({ success: false, message: 'category not found' })
        }
        else {
            return res.status(200).json({ success: true, message: 'Category Details Fatch Success..', data: getCategoryDetailsById })
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "something went wrong! please try again" })
    }
}

module.exports = { getAllCategory, addNewCategory, updateCategory, deleteCategory, getCategoryById }