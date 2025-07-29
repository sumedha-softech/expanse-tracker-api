const express = require('express');
const connectToDB = require('./database/db');
const bodyParser = require('body-parser');
const errorHandler = require('./middleware/errorHandler')
const cors = require('cors')
require('dotenv').config();
const app = express();

//route
const category = require('./routes/category.route');
const account = require('./routes/account.route');
const record = require('./routes/record-list.route');
const log = require('./routes/log.route');
const budget = require('./routes/budget.route');


const allowOrigin = process.env.ORIGIN_URL;
app.use(express.json());
app.use(cors({ origin: [allowOrigin], credentials: true }))
app.use(bodyParser.urlencoded({ extended: true }))
const PORT = process.env.PORT || 3000;
connectToDB();


app.use('/api/category', category);
app.use('/api/account', account);
app.use('/api/record', record);
app.use('/api/log', log);
app.use('/api/budget', budget)


app.use(errorHandler);
app.listen(PORT, () => {
   console.log(`server running on port ${PORT}`)
})

module.exports = app;
// This is the main entry point for the Express application, setting up routes and middleware.