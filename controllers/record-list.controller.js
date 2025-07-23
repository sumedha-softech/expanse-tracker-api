const RecordList = require('../model/record-list.model');
const Account = require('../model/account.model');
const User = require('../model/user.model');
const Log = require('../model/log.model')


//fatch all Records
const getAllRecord = async (req, res) => {
    try {
        const getAllRecord = await RecordList.find({});
        if (getAllRecord.length > 0) {
            return res.status(200).json({ success: true, message: 'All Record Fatch Success', data: getAllRecord })
        }
        else {
            return res.status(404).json({ success: false, message: 'No record Found' })
        }
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

// create new Transaction Records
const addNewRecord = async (req, res) => {
    try {
        const { addNote, amount, type, account, category, date } = req.body;
        if (!amount || !account) {
            return res.status(400).json({ success: false, message: "All Fields are required" })
        }
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const newRecordFormData = { addNote, amount, type, account, category, date};
        const newCreateRecord = await RecordList.create(newRecordFormData);
        
        const updateAmount = type === 'income' ? amount : -amount;
        await Account.findByIdAndUpdate(account, { $inc: { amount: updateAmount }}, {new: true});

       const accountDetails = await Account.findById(account)
       if(!accountDetails) {
        return res.status(404).json({success: false, message: 'Account not Found'})
       }
        if (newCreateRecord) {
            const accountName = accountDetails.name;
            const message = type === 'income' ? `An ${type}  ₹${amount} has been Credit in "${accountName}"Account.By: ${user.username}` : `An ${type} of ₹${amount} has been Debit From  "${accountName}" Account By: ${user.username}`;
            await Log.create({ userId: user._id, message });
            return res.status(201).json({ success: true, message: 'Record Add Success', data: newCreateRecord })
        }
        else {
            return res.status(400).json({ success: false, message: 'Failed to Create Record' })
        }
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'something went worng.! please try again' })
    }
}


//getRecordDetails byId
const getRecordById = async (req, res) => {
    try {
        const getCurrentRecordById = req.params.id;
        const getRecordDetailsById = await RecordList.findById(getCurrentRecordById);
        if (!getRecordDetailsById) {
            return res.status(404).json({ success: false, message: "Record Details Not Found" })
        }
        else {
            return res.status(200).json({ success: true, message: 'Record Details Fatch Success', data: getRecordDetailsById })
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'something went worng.! please try again' })
    }
}

//deleteRecord and update Amount 
const deleteRecord = async (req, res) => {
    try {
        const record = await RecordList.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found.' });
        }
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        //if the transaction record is transfer typr
        if (record.type === 'transfer' && record.fromAccount && record.toAccount) {
            const fromAccount = await Account.findById(record.fromAccount);
            const toAccount = await Account.findById(record.toAccount);
            if (fromAccount && toAccount) {
                fromAccount.amount += record.amount;
                toAccount.amount -= record.amount;
                await fromAccount.save();
                await toAccount.save();
                const message = `Transfer of ₹${record.amount} from "${fromAccount.name}" to "${toAccount.name}" was deleted By: ${user.username}`;
                await Log.create({ userId: user._id, message });
            }
        } else {
            const updateAmount = record.type === 'income' ? -record.amount : record.amount;
            await Account.findByIdAndUpdate(record.account, { $inc: { amount: updateAmount } });
            const message = record.type === 'income' ? `Transaction record of income ₹${record.amount}  was deleted by: ${user.username}` : `Transaction record of expense ₹${record.amount} was deleted by: ${user.username}`;
            await Log.create({ userId: user._id, message })
        }
        await RecordList.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: 'Record deleted successfully.', data: record});
    } catch (err) {
        console.error('Delete record error:', err.message);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
};


//update Records Details
const updateRecord = async (req, res) => {
    try {
        const recordUpdateFormData = req.body;
        const recordId = req.params.id;
        const getRecordDetails = await RecordList.findById(recordId);
        if (!getRecordDetails) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const updateAmount = getRecordDetails.type === 'income' ? -getRecordDetails.amount : getRecordDetails.amount;
        await Account.findByIdAndUpdate(getRecordDetails.account, { $inc: { amount: updateAmount } });
        //Update the record of type income and expense
        const updatedRecord = await RecordList.findByIdAndUpdate(recordId, recordUpdateFormData, { new: true });
        if (!updatedRecord) {
            return res.status(400).json({ success: false, message: 'Failed to update record' });
        }
        //updated transaction record
        const { type, amount, account } = updatedRecord;
        const updatedAmount = type === 'income' ? amount : -amount;
        await Account.findByIdAndUpdate(account, { $inc: { amount: updatedAmount } });
        const message = `Amount  ₹${getRecordDetails.amount} to  ₹${updatedRecord.amount} And  Category Type "${getRecordDetails.type}" to "${updatedRecord.type}" Transaction Update Successfully By: ${user.username} `
        await Log.create({ userId: user._id, message })
        return res.status(200).json({ success: true, message: 'Record updated successfully', data: updatedRecord });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'something went worng.! please try again' })
    }
}


module.exports = { getAllRecord, addNewRecord, deleteRecord, getRecordById, updateRecord }



