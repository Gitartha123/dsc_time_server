const mongoose = require('mongoose');

// Ensure the config object contains the necessary properties
const mongoUrl = "mongodb://admin:qwerty@localhost:27017/dsc?authSource=admin";

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
