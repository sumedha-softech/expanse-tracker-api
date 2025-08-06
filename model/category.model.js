const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
         required: true, 
    },

    type: {
      type: String,
      enum: ['income', 'expense'],
    required: true,  
    }

}, {timestamps: true})
module.exports = mongoose.model('Category',CategorySchema)