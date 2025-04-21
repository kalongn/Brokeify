import passport from 'passport';
import { Strategy } from 'passport-google-oauth20';
import UserController from '../db/controllers/UserController.js';

passport.use(new Strategy({
    clientID: `${process.env.GOOGLE_CLIENT_ID}`,
    clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
    callbackURL: `${process.env.GOOGLE_REDIRECT_URI.replace("\#", process.env.SERVER_PORT)}`, // Remove trailing slash if present
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
        });
    } else {
        user.firstName = profile.name.givenName;
        user.lastName = profile.name.familyName;
        user.email = profile.emails[0].value;
        user.picture = profile.photos[0].value;
        user.refreshToken = refreshToken;
        user.accessToken = accessToken;
        await userController.update(user._id, user);
    }
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
