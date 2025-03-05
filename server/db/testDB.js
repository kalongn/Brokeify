import mongoose from "mongoose";
import 'dotenv/config'

// Connect to MongoDB
const DB_ADDRESS = `${process.env.DB_ADDRESS}`;
mongoose.connect(DB_ADDRESS);
const connection = mongoose.connection;

connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
});

connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

const populateDB = async () => {
    // testing methods go here
};

populateDB();
// Disconnect from MongoDB
connection.close();
// Exit the process
process.exit();
