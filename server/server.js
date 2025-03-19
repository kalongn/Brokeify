import express, { urlencoded, json } from 'express';
import session from 'express-session';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy } from 'passport-google-oauth20';
import 'dotenv/config'

import UserController from './db/controllers/UserController.js';

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
        saveUninitialized: false //TODO: This need to save to MongoDB later
    })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new Strategy({
    clientID: `${process.env.GOOGLE_CLIENT_ID}`,
    clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
    callbackURL: `${process.env.GOOGLE_REDIRECT_URI}`
}, async (accessToken, refreshToken, profile, done) => {
    const userController = new UserController();
    let user = await userController.findByGoogleId(profile.id);
    if (!user) {
        user = await userController.create({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            googleId: profile.id,
            picture: profile.photos[0].value,
            refreshToken: refreshToken,
            accessToken: accessToken,
            permission: "USER", // Default permission for new users
            ownerScenarios: [],
            editorScenarios: [],
            viewerScenarios: [],
            userSpecificTaxes: [],
            userSimulations: []
        });
    }
    console.log("User found or created: ", user);
    return done(null, user._id);
}
));
passport.serializeUser((user, done) => {
    done(null, user._id);
});
passport.deserializeUser(async (id, done) => {
    const userController = new UserController();
    try {
        const user = await userController.read(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

const port = process.env.SERVER_PORT || 8000;
const expressServer = app.listen(port, () => {
    console.log(`Express Server is running on http://localhost:${port}`);
});

app.get("/", async (req, res) => {
    let state = "Not logged in";
    console.log(req.session);
    if (req.session.user) {
        res.send(req.session.user);
    } else {
        res.send(state);
    }
});

app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));
app.get("/auth/google/callback", passport.authenticate("google", {
    failureRedirect: "/"
}), (req, res) => {
    // Successful authentication, redirect to the home page.
    req.session.user = req.user;
    res.redirect(`${process.env.CLIENT_URL}/Home`);
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Could not log out.");
        }
        res.redirect(`${process.env.CLIENT_URL}/`);
    });
});