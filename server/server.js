import express, { urlencoded, json } from 'express';
import session from 'express-session';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import MongoStore from 'connect-mongo';
import 'dotenv/config'

/*
    AI generated code usage here

    Context: this file contains all the route and google authentication setup for the server all in here
    we dislike the lack of organization. So I provide this file as context to Copilot and prompt it "
    refactor this code to be more organized and modular, separating the concerns of route handling and authentication setup
    into their own files.
    
    Result: It generated 2 new file `routes/index.js` and `auth/google.js` to handle the routes and google authentication setup respectively
    and imported them into this file to keep the server.js file clean and organized.
    The routes/index.js file contains all the route handling logic and the auth/google.js file contains the google authentication setup
    This is a good example of how AI can help with code organization and modularization, making it easier to maintain and understand"
*/
import './auth/google.js'; // Import the Google OAuth configuration
import routes from './routes/index.js'; // Import the routes
import guestDeletionCronJob from './cron_job/guestDeletion.js'; // Import the cron job for guest deletion

const mongoDB = `${process.env.DB_ADDRESS}`;
mongoose.connect(mongoDB);

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
});

const app = express();
const corsOptions = {
    origin: `${process.env.CLIENT_URL}`,
    credentials: true,
};

app.use(cors(corsOptions));
app.use(urlencoded({ extended: false }));
app.use(json());

const dayInSeconds = 24 * 60 * 60; // 1 day in seconds

app.use(
    session({
        secret: `${process.env.SECRET}`,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * dayInSeconds, // use miliseconds
        },
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: mongoDB,
            collectionName: 'sessions',
            ttl: dayInSeconds,
            autoRemove: 'interval', // Automatically remove expired sessions
            autoRemoveInterval: 10 // Interval in minutes to check for expired sessions
        })
    })
);

// Use passport for authentication and in session management, auth/google.js sets up the Google OAuth strategy
app.use(passport.initialize());
app.use(passport.session());

// Use the routes defined in the routes/index.js file
app.use('/', routes);

// Start the cron job for guest deletion
guestDeletionCronJob();

const port = process.env.SERVER_PORT || 8000;
const expressServer = app.listen(port, () => {
    console.log(`Express Server is running on http://localhost:${port}`);
});