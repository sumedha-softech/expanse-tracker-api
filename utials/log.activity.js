// const Log = require('../model/log.model');
// const User = require('../model/user.model');

// const createLog = async (message) => {
//   try {
//     const user = await User.findOne({}); 
//     if (!user) {
//      return res.status(404).json({success: false, message: 'User Not Found'})
//       return;
//     }
//     const log = new Log({ userId: user._id, message });
//     await log.save();
//   } catch (error) {
//     console.error(' Logging failed:', error.message);
//   }
// };

// module.exports = {createLog};
