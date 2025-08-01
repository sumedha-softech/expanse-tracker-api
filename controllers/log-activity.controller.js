const Log = require('../model/log.model');
const asyncHandler = require('../utials/asyncHandler');
const ApiError = require('../utials/apiError');

//get All activity logs
const fetchAllLogs = asyncHandler(async (req, res) => {
    const logs = await Log.find({}).populate('userId').sort({date: -1});
    if (logs.length === 0) {
        return res.status(204).send();
    }
    res.status(200).json({ success: true, message: 'All Logs Fetched Successfully', data:logs });

});


module.exports = { fetchAllLogs }


