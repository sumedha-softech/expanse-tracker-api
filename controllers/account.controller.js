const Account = require('../model/account.model');
const RecordList = require('../model/record-list.model');
const User = require('../model/user.model');
const Log = require('../model/log.model')


//getAllAccounts
const getAllAccount = async (req, res) => {
    try {
        const getAllAccount = await Account.find({}).populate('recordId');
        if (getAllAccount.length > 0) {
            return res.status(200).json({ success: true, message: 'All Accounts Fatch Successfully', data: getAllAccount })
        }
        else {
            return res.status(404).json({ success: false, message: 'Accounts Not Found' })
        }
    }
    catch (error) {
        console.error('Faiiled to Fatch Accounts', error.message);
        return res.status(500).json({
            success: false, message: 'something went wrong! please try again'
        })
    }
}

//create New account
const addNewAccount = async (req, res) => {
    try {
        const { name, amount, type } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
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
        const message = `Account "${newCreatedAccount.name}" Created with Initial Amount ₹${amount} By: ${user.username}.`;
        await Log.create({ userId: user._id, message });

        return res.status(201).json({ success: true, message: 'Account created successfully.', data: newCreatedAccount });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Something went wrong..! Please try again', });
    }
};


//deleteAccount from account list
const deleteAccount = async (req, res) => {
    try {
        const accountId = req.params.id;
        const deleteAccount = await Account.findById(accountId);
        if (!deleteAccount) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        //find all transaction of transfer amount
        const transferAmount = await RecordList.find({ toAccount: accountId, isTransfer: true });
        for (const transfer of  transferAmount) {
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
        const message = `"${deleteAccount.name}" Account deleted by: ${user.username}`;
        await Log.create({ userId: user._id, message });
        return res.status(200).json({ success: true, message: 'Account deleted successfully. Transfer records removed, and sender records updated.', data: deleteAccount });

    } catch (error) {
        console.error('Failed to delete Account', error.message);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong! Please try again.'
        });
    }
};


// transfer amount from one account to another
const transferAmount = async (req, res) => {
    try {
        const { fromAccountId, toAccountId, amount } = req.body;
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Enter a valid Amount.! Must be grater then 0' });
        }
        if (fromAccountId === toAccountId) {
            return res.status(400).json({ success: false, message: 'Accounts are same choose different Account..' });
        }
        const fromAccount = await Account.findById(fromAccountId);
        const toAccount = await Account.findById(toAccountId);
        if (!fromAccount || !toAccount) {
            return res.status(404).json({ success: false, message: 'Account not Found.!!' });
        }
        if (fromAccount.amount < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient Amount.!' });
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
        const message = `  Amount ₹${amount} Transfer "${fromAccount.name}" Account To  "${toAccount.name}" Account. BY: ${user.username}`;
        await Log.create({ userId: user._id, message });
        return res.status(200).json({ success: true, message: 'Amount Transfer Successfull', data: { fromAccount, toAccount, transferAmountRecord } });
    } catch (error) {
        console.error('Transfer failed:', error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


// Update an existing transfer transaction records
const updateTransferAmount = async (req, res) => {
    try {
        const { fromAccountId, toAccountId, amount, recordId } = req.body;
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!recordId || !fromAccountId || !toAccountId || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'invalid transfer Amount' });
        }
        if (fromAccountId === toAccountId) {
            return res.status(400).json({ success: false, message: 'both Accounts cannot be the same' });
        }
        const record = await RecordList.findById(recordId);
        if (!record || !record.isTransfer) {
            return res.status(404).json({ success: false, message: 'Transfer record not found.' });
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
        //fatch and validate Accounts
        const newFromAccount = await Account.findById(fromAccountId);
        const newToAccount = await Account.findById(toAccountId);
        if (!newFromAccount || !newToAccount) {
            return res.status(404).json({ success: false, message: 'Account not Found' });
        }
        if (newFromAccount.amount < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient Amount.!.' });
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
        const message = `Transfer updated: ₹${amount} from "${newFromAccount.name}" to "${newToAccount.name} By: ${user.username}"`;

        await Log.create({ userId: user._id, message });
        return res.status(200).json({ success: true, message: 'Transfer record updated successfully.', data: record });
    } catch (error) {
        console.error('Transfer update failed:', error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error!. Please try again' });
    }
};

//fatch accountDetails by AccountId
const getAccountById = async (req, res) => {
    try {
        const getCurrentAccountById = req.params.id;
        const getAccountDetailsById = await Account.findById(getCurrentAccountById);
        if (!getAccountDetailsById) {
            return res.status(404).json({ success: false, message: "Account  Not Found" })
        }
        else {
            return res.status(200).json({ success: true, message: 'Account Details Fatch Successful', data: getAccountDetailsById })
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'something went wrong! please try again.' })
    }
}


//udpate account and adjust account balance after updation
const updateAccount = async (req, res) => {
    try {
        const { accountId, recordId, name, amount } = req.body;
        const user = await User.findOne({});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!accountId || !name || amount == null) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        //find account byId
        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
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
                message += `transaction record updated  by:  ${user.username}`;
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
            message += `Initial transaction record created)`;
        }
        await Log.create({ userId: user._id, message });

        return res.status(200).json({ success: true, message: 'Account and Transaction updated successfully', data: account });

    } catch (err) {
        console.error('Update Account Error:', err.message);
        return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};


module.exports = { getAllAccount, addNewAccount, getAccountById, deleteAccount, transferAmount, updateAccount, updateTransferAmount };