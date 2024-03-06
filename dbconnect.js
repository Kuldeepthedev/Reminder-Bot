// db.js
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = async () => {
    
    try {
        const connection = await mongoose.connect(process.env.MONGODBPASS
        , { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');
        return connection;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
};

module.exports = connectDB;
