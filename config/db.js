const mongoose = require('mongoose');


//database connection

function connectDatabase() {
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })

    .catch((err) => {
        console.log("MongoDB not connected:", err.message);

    });

    
}

module.exports = connectDatabase;