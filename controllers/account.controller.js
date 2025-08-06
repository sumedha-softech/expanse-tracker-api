const Account = require('../model/account.model');
const RecordList = require('../model/record-list.model');
const asyncHandler = require('../utials/asyncHandler');
const createLog = require('../utials/log');
const ApiError = require('../utials/apiError');


//getAllAccounts
const fetchAllAccounts = asyncHandler(async (req, res) => {
    const accounts = await Account.find({}).populate('recordId');
    if (accounts.length === 0) {
        return res.status(204).send()
    }
    res.status(200).json({ success: true, message: 'All Accounts Fetched Successfully', data: accounts });
});




//create New account
const createAccount = asyncHandler(async (req, res) => {
    const { name, amount, type } = req.body;
    if (!name) {
        throw new ApiError(400, 'Account name is required');
    }
    const newCreatedAccount = await Account.create({ name, amount: 0, type });
    if (amount && amount > 0) {
        const createdRecord = await RecordList.create({
            amount: amount,
            type: 'income',
            account: newCreatedAccount._id,
            addNote: `"${name}" Account Created With initial Amount ₹${amount}`,
            isInitialEntry: true
        });
        // created record' 
        await Account.findByIdAndUpdate(newCreatedAccount._id, { $inc: { amount: amount }, $set: { recordId: createdRecord._id } });
    }
    await createLog(`Account "${newCreatedAccount.name}" Created with Initial Amount ₹${amount}`);
    res.status(201).json({ success: true, message: 'Account created successfully.', data: newCreatedAccount });
});


//remove Account from account list
const removeAccountById = asyncHandler(async (req, res) => {
    const accountId = req.params.id;
    const deleteAccount = await Account.findById(accountId);
    if (!deleteAccount) {
        throw new ApiError(404, 'Account not found')
    }
    //find all transaction of transfer amount
    const transferAmount = await RecordList.find({ toAccount: accountId, isTransfer: true });
    for (const transfer of transferAmount) {
        const { fromAccount } = transfer;
        const getFromAccount = await Account.findById(fromAccount);
        if (getFromAccount) {
            const initialRecord = await RecordList.findOne({ account: getFromAccount._id, isInitialEntry: true, type: 'income' });
            if (initialRecord) {
                initialRecord.amount = getFromAccount.amount;
                initialRecord.addNote = `Updated  Amount after Delete "${deleteAccount.name}" Account ₹${getFromAccount.amount}`;
                await initialRecord.save();
            }
        }
        await RecordList.findByIdAndDelete(transfer._id);
    }
    await RecordList.deleteMany({ account: accountId });
    await Account.findByIdAndDelete(accountId);
    await createLog(`"${deleteAccount.name}" Account deleted`);
    res.status(200).json({ success: true, message: 'Account deleted successfully. Transfer records removed, and records updated.', data: deleteAccount });


});


// transfer amount from one account to another
const transferAmountBetweenAccounts = asyncHandler(async (req, res) => {
    const { fromAccountId, toAccountId, amount } = req.body;
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
        throw new ApiError(400, 'Enter a valid Amount.! Must be greater then 0')
    }
    if (fromAccountId === toAccountId) {
        throw new ApiError(400, 'Both accounts are same choose different Account.')
    }
    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);
    if (!fromAccount || !toAccount) {
        throw new ApiError(404, 'Account not found');
    }
    if (fromAccount.amount < amount) {
        throw new ApiError(400, 'Insufficient Amount.!');
    }
    //amount transfer 
    fromAccount.amount -= amount;
    toAccount.amount += amount;
    await fromAccount.save();
    await toAccount.save();
    //create a transfer transaction record
    const transferAmountRecord = await RecordList.create({
        account: fromAccount._id,
        type: 'transfer',
        amount,
        fromAccount: fromAccount._id,
        toAccount: toAccount._id,
        addNote: `Transferred ₹${amount} from "${fromAccount.name}" to "${toAccount.name}" Account.`,
        isTransfer: true,
    });
    await createLog(` Amount ₹${amount} Transfer "${fromAccount.name}" Account To  "${toAccount.name}" Account.`);
    res.status(200).json({ success: true, message: 'Amount Transfer Successfull', data: { fromAccount, toAccount, transferAmountRecord } });

});


// Update an existing transfer transaction records
const updateTransferTransaction = asyncHandler(async (req, res) => {
    const { fromAccountId, toAccountId, amount, recordId } = req.body;
    if (!recordId || !fromAccountId || !toAccountId || !amount || amount <= 0) {
        throw new ApiError(400, 'invalid transfer Amount');
    }
    if (fromAccountId === toAccountId) {
        throw new ApiError(400, 'Both Accounts cannot be the same');
    }
    const record = await RecordList.findById(recordId);
    if (!record || !record.isTransfer) {
        throw new ApiError(404, 'Transfer record not found');
    }
    //updated Amount after updated Transfer Transaction add back amount while updating transaction record
    const oldFromAccount = await Account.findById(record.fromAccount);
    const oldToAccount = await Account.findById(record.toAccount);
    if (oldFromAccount) {
        oldFromAccount.amount += record.amount;
        await oldFromAccount.save();
    }
    if (oldToAccount) {
        oldToAccount.amount -= record.amount;
        await oldToAccount.save();
    }


    //Fetch and validate Accounts
    const newFromAccount = await Account.findById(fromAccountId);
    const newToAccount = await Account.findById(toAccountId);
    if (!newFromAccount || !newToAccount) {
        throw new ApiError(404, 'Account not found');
    }
    if (newFromAccount.amount < amount) {
        throw new ApiError(400, 'Insufficient Amount.!')
    }

    newFromAccount.amount -= amount,
        newToAccount.amount += amount
    await newFromAccount.save();
    await newToAccount.save();

    // Update the transfer record
    record.fromAccount = fromAccountId;
    record.toAccount = toAccountId;
    record.amount = amount;
    record.account = fromAccountId;
    record.addNote = `Transferred ₹${amount} from "${newFromAccount.name}" to  "${newToAccount.name}" Account.`;
    record.updatedAt = new Date();
    await record.save();
    await createLog(`Transfer updated: ₹${amount} from "${newFromAccount.name}" to "${newToAccount.name}`);
    res.status(200).json({ success: true, message: 'Transfer record updated successfully.', data: record });
});

//Fetch accountDetails by AccountId
const fetchAccountById = asyncHandler(async (req, res) => {
    const fetchAccountById = req.params.id;
    const fetchAccountDetailsById = await Account.findById(fetchAccountById);
    if (!fetchAccountDetailsById) {
        throw new ApiError(404, 'Account not Found');
    }
    res.status(200).json({ success: true, message: 'Account Details Fetch Successful', data: fetchAccountDetailsById });

});


//update account and adjust account balance after updation
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { accountId, recordId, name, amount } = req.body;
    if (!accountId || !name || amount == null) {
        throw new ApiError(400, 'All fields are required');
    }
    const account = await Account.findById(accountId);
    if (!account) {
        throw new ApiError(404, 'Account not found');
    }
    let message = '';
    account.name = name;
    message = `Account "${name}" updated.`;
    if (recordId) {
        const record = await RecordList.findById(recordId);
        if (record && record.isInitialEntry) {
            const oldInitialAmount = record.amount;
            if (amount === 0) {
                await RecordList.findByIdAndDelete(recordId);
                const remaining = account.amount - oldInitialAmount;
                account.amount = remaining;
                account.recordId = null;
                message += ` Initial record deleted (was ₹${oldInitialAmount}).`;
            } else {
                const remaining = account.amount - oldInitialAmount;
                record.amount = amount;
                record.addNote = `Initial amount updated to ₹${amount}`;
                await record.save();

                account.amount = remaining + amount;
                message += ` Initial amount changed from ₹${oldInitialAmount} to ₹${amount}.`;
            }
        } else {
            throw new ApiError(400, 'Invalid initial entry');
        }

    } else {
        if (amount > 0) {
            const createdRecord = await RecordList.create({
                amount,
                type: 'income',
                account: account._id,
                addNote: `Initial amount set to ₹${amount}`,
                isInitialEntry: true,
            });
            account.amount += amount;
            account.recordId = createdRecord._id;
            message += ` Initial record created with ₹${amount}.`;
        }
    }
    await account.save();
    await createLog(message);
    res.status(200).json({ success: true, message, data: account });
});

module.exports = { fetchAllAccounts, fetchAccountById, createAccount, removeAccountById, updateAccountDetails, updateTransferTransaction, transferAmountBetweenAccounts };