import mongoose from 'mongoose';
import 'dotenv/config';

const mongoDB = `${process.env.DB_ADDRESS}`;

mongoose.connect(mongoDB);
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.once('open', async () => {
    await mongoose.connection.db.dropDatabase()
    await mongoose.connection.close();
    process.exit();
});

