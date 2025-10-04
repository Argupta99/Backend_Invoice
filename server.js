//server setup

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDatabase = require('./config/db');
const app = express();

connectDatabase();

//middleware 

app.use(cors());
app.use(express.json());

const port = process.env.port || 5000;
app.listen(port, () => {
console.log(`server is running`);
});