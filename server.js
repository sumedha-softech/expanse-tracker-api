const express = require('express');
const connectToDB = require('./database/db');
const bodyParser = require('body-parser');
const errorHandler = require('./middleware/errorHandler')
const cors = require('cors')
require('dotenv').config();
const app = express();

//route
const categories = require('./routes/category.route');
const accounts = require('./routes/account.route');
const records = require('./routes/record-list.route');
const logs = require('./routes/log.route');
const budgets= require('./routes/budget.route');


const allowOrigin = process.env.ORIGIN_URL;
app.use(express.json());
app.use(cors({ origin: [allowOrigin], credentials: true }))
app.use(bodyParser.urlencoded({ extended: true }))
const PORT = process.env.PORT || 3000;
connectToDB();


app.use('/api/categories',categories);
app.use('/api/accounts', accounts);
app.use('/api/records', records);
app.use('/api/logs', logs);
app.use('/api/budgets', budgets)


app.use(errorHandler);
app.listen(PORT, () => {
   console.log(`server running on port ${PORT}`)
})

module.exports = app;
// This is the main entry point for the Express application, setting up routes and middleware.
