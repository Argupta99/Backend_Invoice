//server setup

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDatabase = require('./config/db');
const uploadRoute = require('./routes/uploadRoute');
const app = express();

connectDatabase();

//middleware 

app.use(cors());
app.use(express.json());


//routes
app.use('/upload', uploadRoute);

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Backend is running fine!");
});


app.listen(port, () => {
console.log(`server is running`);
});