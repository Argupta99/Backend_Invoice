const mongoose = require('mongoose');


//database connection

function connectDatabase() {
    mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected");
    })

    .catch((err) => {
        console.log("MongoDB not connected:", err.message);

    });

    
}

module.exports = connectDatabase;