const mongoose = require('mongoose')

const AccountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
 
    },
    amount: {
        type: Number,
        required: true,
        default: 0,
    },
    type: {
        type: String,
        default: 'income'
    },
    recordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RecordList',
        default: null
    }
  
}, { timestamps: true })

module.exports = mongoose.model('Account', AccountSchema);