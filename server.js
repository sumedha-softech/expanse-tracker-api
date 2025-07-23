const express = require('express');
const connectToDB = require('./database/db');
const cors= require('cors')
require('dotenv').config();
const app =  express();

//category route
const categoryRoutes = require('./routes/category.route');
//account routes
const accountRoutes = require('./routes/account.route');

const recordRoutes =require('./routes/record-list.route');
const logRoutes = require('./routes/log.route');
const budgetRoutes = require('./routes/budget.route');


app.use(express.json());

app.use(cors({origin: ['http://localhost:4200']}))

const PORT = process.env.PORT || 3000;
connectToDB();


app.use('/api/category', categoryRoutes);
app.use('/api/account',accountRoutes );
app.use('/api/record', recordRoutes);
app.use('/api/log', logRoutes);
app.use('/api/budget', budgetRoutes)


app.listen(PORT, ()=>{
    console.log(`server running on http://loalhost:${PORT}`)
})