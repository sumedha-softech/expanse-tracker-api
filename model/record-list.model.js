const mongoose = require('mongoose');

const RecordListSchema = new mongoose.Schema({
    addNote: {
        type: String,
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['income', 'expense', 'transfer'],
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',  
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
      date: {
        type: Date,
        default: Date.now,
    },
    isInitialEntry: {
        type : Boolean,
        default: false,
    },
    isTransfer: {
        type: Boolean,
        default: false,
    },
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    }
 
}, { timestamps: true })


module.exports = mongoose.model('RecordList', RecordListSchema);