const mongoose = require('mongoose');
const BudgetSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    limit: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }

}, { timestamps: true });

module.exports = mongoose.model('Budget', BudgetSchema);