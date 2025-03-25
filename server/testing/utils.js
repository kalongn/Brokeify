import mongoose from "mongoose";

export async function connectToDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/');
        //console.log('Connected to MongoDB');
        return mongoose.connection;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

export async function closeDatabaseConnection() {
    try {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
        process.exit(1);
    }
}