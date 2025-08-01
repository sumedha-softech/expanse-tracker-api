const RecordList = require('../model/record-list.model');
const Account = require('../model/account.model');
const asyncHandler = require('../utials/asyncHandler');
const createLog = require('../utials/log');
const ApiError = require('../utials/apiError');

// transaction Records
const fetchAllRecords = asyncHandler(async (req, res) => {
    const transactions = await RecordList.find({}).sort({ date: -1 });
    if (transactions.length === 0) {
      return res.status(204).send();
    }
    return res.status(200).json({ success: true, message: 'All Transaction Record Fetched Successfully', data: transactions })

});

// create new Transaction Records
const createRecord = asyncHandler(async (req, res) => {
    const { addNote, amount, type, account, category, date } = req.body;
    if (!amount || !account) {
        throw new ApiError(400, "All Fields are required");
    }
    const newRecordFormData = { addNote, amount, type, account, category, date };
    const newCreateRecord = await RecordList.create(newRecordFormData);
    const updateAmount = type === 'income' ? amount : -amount;
    await Account.findByIdAndUpdate(account, { $inc: { amount: updateAmount } }, { new: true });

    const accountDetails = await Account.findById(account)
    if (!accountDetails) {
        throw new ApiError(404, 'Account not found');
    }
    if (newCreateRecord) {
        const accountName = accountDetails.name;
        const message = type === 'income'
            ? `An ${type} of ₹${amount} has been credited to the "${accountName}" account.`
            : `An ${type} of ₹${amount} has been debited from the "${accountName}" account`;
        await createLog(message);
        return res.status(201).json({ success: true, message: 'Record Add Success', data: newCreateRecord })
    }
    throw new ApiError(400, 'Failed to Create Record');

});


//getRecordDetails byId
const fetchTransactionRecordById = asyncHandler(async (req, res) => {
    const recordId = req.params.id;
    const record = await RecordList.findById(recordId);
    if (!record) {
        throw new ApiError(404, 'Record Details Not Found')
    }
    return res.status(200).json({ success: true, message: 'Record Details Fetch Success', data: record })
});

//deleteRecord and update Amount 
const deleteRecordById = asyncHandler(async (req, res) => {
    const record = await RecordList.findById(req.params.id);
    if (!record) {
        throw new ApiError(404, 'Transaction Record not found');
    }
    // transfer type
    if (record.type === 'transfer' && record.fromAccount && record.toAccount) {
        const fromAccount = await Account.findById(record.fromAccount);
        const toAccount = await Account.findById(record.toAccount);
        if (fromAccount && toAccount) {
            fromAccount.amount += record.amount;
            toAccount.amount -= record.amount;

            await fromAccount.save();
            await toAccount.save();

            const message = `Transfer of ₹${record.amount} from "${fromAccount.name}" to "${toAccount.name}" was deleted`;
            await createLog(message);
        }
    } else {
        const updateAmount = record.type === 'income' ? -record.amount : record.amount;
        await Account.findByIdAndUpdate(record.account, {
            $inc: { amount: updateAmount }
        });
        const message =
            record.type === 'income'
                ? `Transaction record of income ₹${record.amount} was deleted`
                : `Transaction record of expense ₹${record.amount} was deleted`;
        await createLog(message);
    }
    await RecordList.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Record deleted successfully.', data: record });
});



//update Records Details
const updateRecordDetails = asyncHandler(async (req, res) => {
    const recordUpdateFormData = req.body;
    const recordId = req.params.id;
    const getRecordDetails = await RecordList.findById(recordId);
    if (!getRecordDetails) {
        throw new ApiError(404, 'Transaction Record not found')
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
    const message = `Amount  ₹${getRecordDetails.amount} to  ₹${updatedRecord.amount} And  Category Type "${getRecordDetails.type}" to "${updatedRecord.type}" Transaction Update Successfully`;
    await createLog(message);
    return res.status(200).json({ success: true, message: 'Record updated successfully', data: updatedRecord });
});


module.exports = { fetchAllRecords, createRecord, fetchTransactionRecordById, deleteRecordById, updateRecordDetails }



