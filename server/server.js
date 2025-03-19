import express, { urlencoded, json } from 'express';
import session from 'express-session';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import MongoStore from 'connect-mongo';
import 'dotenv/config'

import './auth/google.js'; // Import the Google OAuth configuration
import routes from './routes/index.js'; // Import the routes

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

app.use(
    session({
        secret: `${process.env.SECRET}`,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds.
        },
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: mongoDB,
            collectionName: 'sessions',
            ttl: 7 * 24 * 60 * 60, // 7 days in seconds
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

const port = process.env.SERVER_PORT || 8000;
const expressServer = app.listen(port, () => {
    console.log(`Express Server is running on http://localhost:${port}`);
});