import express, { urlencoded, json } from 'express';
import session from 'express-session';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config'

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