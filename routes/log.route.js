const  express= require('express');
const router = express.Router();
const  {fetchAllLogs} = require('../controllers/log-activity.controller');


router.get('/',  fetchAllLogs);


module.exports = router;