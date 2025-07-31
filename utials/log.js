const User = require('../model/user.model');
const Log = require('../model/log.model');
const ApiError = require('../utials/apiError');


const createLog = async (message) => {
    const user = await User.findOne();
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    const logMessage = `${message} By: ${user.username}`;
    await Log.create({ userId: user._id, message: logMessage });
};

module.exports = createLog;
