const  express= require('express');
const router = express.Router();
const  {getAllLogs} = require('../controllers/log-activity.controller');


router.get('/getAllLogs', getAllLogs);


module.exports = router;