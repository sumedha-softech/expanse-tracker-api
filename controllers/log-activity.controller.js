const Log = require('../model/log.model');
const asyncHandler = require('../utials/asyncHandler');
const ApiError = require('../utials/apiError');

//get All activity logs
const getAllLogs = asyncHandler(async (req, res) => {
    const getAllLogs = await Log.find({}).populate('userId').sort({date: -1});
    if (getAllLogs.length === 0) {
        throw new ApiError(404,'Logs not found')
    }
    res.status(200).json({ success: true, message: 'Logs Fetch Successfully', data: getAllLogs });

});


module.exports = { getAllLogs }


