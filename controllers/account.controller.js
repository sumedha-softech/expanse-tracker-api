const Account = require('../model/account.model');
const RecordList = require('../model/record-list.model');
const asyncHandler = require('../utials/asyncHandler');
const createLog = require('../utials/log');
const ApiError = require('../utials/apiError');


//getAllAccounts
const getAllAccount = asyncHandler(async (req, res) => {
    const account = await Account.find({}).populate('recordId');
    if (account.length === 0) {
        throw new  ApiError(404, 'No account found')
    }
    res.status(200).json({ success: true, message: 'All Accounts Fetch Successfully', data: account });
});

//create New account
const addNewAccount = asyncHandler(async (req, res) => {
    const { name, amount, type } = req.body;
    if (!name) {
        throw new ApiError(400,'Account name is required');
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


//deleteAccount from account list
const deleteAccount = asyncHandler(async (req, res) => {
    const accountId = req.params.id;
    const deleteAccount = await Account.findById(accountId);
    if (!deleteAccount) {
        throw new ApiError(404,'Account not found')
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
const transferAmount = asyncHandler(async (req, res) => {
    const { fromAccountId, toAccountId, amount } = req.body;
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
        throw new ApiError(400,'Enter a valid Amount.! Must be greater then 0')
    }
    if (fromAccountId === toAccountId) {
        throw new ApiError(400,'Both accounts are same choose different Account.')
    }
    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);
    if (!fromAccount || !toAccount) {
        throw new ApiError(404,'Account not found');
    }
    if (fromAccount.amount < amount) {
        throw new ApiError(400,'Insufficient Amount.!');
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
const updateTransferAmount = asyncHandler(async (req, res) => {
    const { fromAccountId, toAccountId, amount, recordId } = req.body;
    if (!recordId || !fromAccountId || !toAccountId || !amount || amount <= 0) {
        throw new ApiError(400,'invalid transfer Amount');
    }
    if (fromAccountId === toAccountId) {
        throw new ApiError(400,'Both Accounts cannot be the same');
    }
    const record = await RecordList.findById(recordId);
    if (!record || !record.isTransfer) {
        throw new ApiError(404,'Transfer record not found');
    }
    //updated Amount after updated Transfer Transaction add back amount while updating transaction record
    const oldFromAccount = await Account.findById(record.fromAccount);
    const oldToAccount = await Account.findById(record.toAccount);
    if (oldFromAccount) {
        oldFromAccount.amount += record.amount;
    }
    if (oldToAccount) {
        oldToAccount.amount -= record.amount
    }
    await oldFromAccount.save();
    await oldToAccount.save();
    //Fetch and validate Accounts
    const newFromAccount = await Account.findById(fromAccountId);
    const newToAccount = await Account.findById(toAccountId);
    if (!newFromAccount || !newToAccount) {
        throw new ApiError(404,'Account not found');
    }
    if (newFromAccount.amount < amount) {
        throw new ApiError(400,'Insufficient Amount.!')
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
const getAccountById = asyncHandler(async (req, res) => {
    const getAccountById = req.params.id;
    const getAccountDetailsById = await Account.findById(getAccountById);
    if (!getAccountDetailsById) {
        throw new ApiError(404,'Account not Found');
    }
    res.status(200).json({ success: true, message: 'Account Details Fetch Successful', data: getAccountDetailsById });

});


//update account and adjust account balance after updation
const updateAccount = asyncHandler(async (req, res) => {
    const { accountId, recordId, name, amount } = req.body;
    if (!accountId || !name || amount == null) {
        throw new ApiError(400,'All fields are required');
    }
    //find account byId
    const account = await Account.findById(accountId);
    if (!account) {
        throw new ApiError(404,'Account not found');
    }
    const oldAmount = account.amount;
    const newAmount = amount;
    const currentAmount = newAmount - oldAmount;
    //Update Account Name and Amount
    account.name = name;
    account.amount = newAmount;
    await account.save();

    let message = `Account "${name}" updated. Amount changed from ₹${oldAmount} to ₹${newAmount}`;
    ///delete transaction record Entry when updated amount equal zero
    if (recordId && newAmount === 0) {
        const record = await RecordList.findById(recordId);
        if (record && record.isInitialEntry) {
            await RecordList.findByIdAndDelete(recordId);
            account.recordId = null;
            await account.save();
        }
    }
    else if (recordId && newAmount > 0) {
        const record = await RecordList.findById(recordId);
        if (record && record.isInitialEntry) {
            record.amount = newAmount;
            record.addNote = `Account "${name}" updated with amount ₹${newAmount}`;
            await record.save();
            message += `transaction record updated`;
        }
    }
    //if user have no record exists and new Amount more then 0 create record
    else if (!recordId && newAmount > 0) {
        const createdRecord = await RecordList.create({
            amount: newAmount,
            type: 'income',
            account: account._id,
            addNote: `Account "${name}" updated with initial amount ₹${newAmount}`,
            isInitialEntry: true
        });
        account.recordId = createdRecord._id;
        await account.save();
    }
    await createLog(`Initial transaction record created with ₹${newAmount}`);
    res.status(200).json({ success: true, message: 'Account and Transaction updated successfully', data: account });
});


module.exports = { getAllAccount, addNewAccount, getAccountById, deleteAccount, transferAmount, updateAccount, updateTransferAmount };