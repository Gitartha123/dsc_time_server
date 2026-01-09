const mongoose = require('mongoose');

// Ensure the config object contains the necessary properties
const mongoUrl = process.env.MONGO_URI;
const connectDB = async () => {
    try {
        await mongoose.connect(mongoUrl, {

        });
        console.log("MongoDB is connected successfully");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
};

module.exports = connectDB;
