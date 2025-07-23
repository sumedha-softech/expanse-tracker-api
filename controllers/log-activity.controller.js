const Log = require('../model/log.model')

//get All activity logs
const getAllLogs = async (req, res) => {
    try {
        const getAllLogActivity = await Log.find({}).populate('userId');
        if (getAllLogActivity.length > 0) {
            return res.status(200).json({ success: true, message: 'Activity logs fetched', data: getAllLogActivity });
        }
        else {
            return res.status(404).json({ success: false, message: 'log activity not found' })
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching logs' });
    }
}


module.exports = { getAllLogs }


